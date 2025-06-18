import {BlockAbstractDb} from "@/entities/BlockAbstractDb";
import {
  IBlock,
  IBlockParameter, IBlockParameterDataType, // Restored
  IBlockParameterPossibleValue, // Restored
  IBlockRelation, IBlockStructureKind, /* IBlockTabKind, */ IBlockTitleForms
} from "@/entities/ConstructorEntities";
import {generateUUID} from "@/utils/UUIDUtils";
// import {useLiveQuery} from "dexie-react-hooks"; // This seems unused
import {BookDB, bookDb} from "@/entities/bookDb";
import {BlockRelationRepository} from "@/repository/Block/BlockRelationRepository";
import {BlockParameterRepository} from "./BlockParameterRepository"; // Added
import {BlockTabRepository} from "./BlockTabRepository"; // Added
import {InkLuminMlApi, InkLuminApiError} from "@/api/inkLuminMlApi";
import {BlockInstanceRepository} from "@/repository/BlockInstance/BlockInstanceRepository";
import {notifications} from "@mantine/notifications";
import { updateBookLocalUpdatedAt } from "@/utils/bookSyncUtils";

const getByUuid = async (db: BlockAbstractDb, blockUuid: string) => {
  return db.blocks.where("uuid").equals(blockUuid).first()
}

const getByUuidList = async (db: BlockAbstractDb, blockUuids: string[]) => {
  return db.blocks.where("uuid").anyOf(blockUuids).toArray()
}


const getSiblings = async (db: BlockAbstractDb, block: IBlock) => {
  return db.blocks.where(
      {
        configurationUuid: block.configurationUuid
      })
      .filter(b => b.uuid !== block.uuid)
      .toArray()
}

// Создание блока
const create = async (db: BlockAbstractDb, block: IBlock, isBookDb = false, titleForms?: IBlockTitleForms) => {
  if (titleForms) {
    block.titleForms = titleForms;
  } else {
    try {
      block.titleForms = await InkLuminMlApi.fetchAndPrepareTitleForms(block.title);
    } catch (error) {
      if (error instanceof InkLuminApiError) {
        throw error; // Re-throw the specific API error
      }
      // Handle other potential errors or re-throw them as generic errors
      throw new Error(`Failed to prepare title forms during block creation: ${error.message}`);
    }
  }
  block.uuid = generateUUID()
  block.showInMainMenu = 1; // Set default value for showInMainMenu
  const blockId = await db.blocks.add(block)
  const persistedBlockData = await db.blocks.get(blockId)
  await BlockParameterRepository.appendDefaultParamGroup(db, persistedBlockData) // Updated call
  await BlockTabRepository.appendDefaultTab(db, persistedBlockData) // Updated call

  // Если это книжная БД, создаем инстанс блока
  if (isBookDb && block.structureKind === 'single'){
    await BlockInstanceRepository.createSingleInstance(db as BookDB, block)
  }
  if (isBookDb) {
    await updateBookLocalUpdatedAt(db as BookDB);
  }
  return block.uuid
}

// Обновление данных блока
const update = async (db: BlockAbstractDb, block: IBlock, isBookDb = false, titleForms?: IBlockTitleForms) => {
  const prevBlockData = await getByUuid(db, block.uuid);

  // Если переданы titleForms, используем их
  if (titleForms) {
    block.titleForms = titleForms;
  }
  // Если название блока изменилось и titleForms не переданы, пытаемся получить их через API
  else if (prevBlockData && prevBlockData.title !== block.title) {
    try {
      block.titleForms = await InkLuminMlApi.fetchAndPrepareTitleForms(block.title);
    } catch (error) {
      if (error instanceof InkLuminApiError) {
        throw error; // Re-throw the specific API error
      }
      // Handle other potential errors or re-throw them as generic errors
      throw new Error(`Failed to prepare title forms during block update: ${error.message}`);
    }
  }

  // Если блок стал одиночным, а был неодиночным, то создаем инстанс блока, если он не имеет инстансов
  if (isBookDb
      &&(prevBlockData?.structureKind !== IBlockStructureKind.single)
      && (block.structureKind === IBlockStructureKind.single)
  ){
    const childInstances = await BlockInstanceRepository.getChildInstances(db as BookDB, block.uuid)
    if (childInstances.length === 0){
      await BlockInstanceRepository.createSingleInstance(db as BookDB, block)
    }
  }
  db.blocks.update(block.id, block)
  if (isBookDb) {
    await updateBookLocalUpdatedAt(db as BookDB);
  }
}

// Сохранение блока
const save = async (db: BlockAbstractDb, block: IBlock, isBookDb = false, titleForms?: IBlockTitleForms) => {
  try {
    // Создание блока
    if (!block.uuid) {
      await create(db, block, isBookDb, titleForms)
    } else {
      // Обновление блока
      await update(db, block, isBookDb, titleForms)
    }
  }
  catch (error){
    if (error instanceof InkLuminApiError) {
      throw error; // Re-throw for UI to handle
    }
    notifications.show({
      title: "Ошибка запроса",
      message: error instanceof Error ? error.message : "Ошибка",
      color: "red",
    });
  }
}

const remove = async (db: BlockAbstractDb, block: IBlock) => {
  // Получаем все группы параметров блока и удаляем их через BlockParameterRepository
  const groups = await BlockParameterRepository.getParameterGroups(db, block.uuid)
  for (const group of groups) {
    if (!group.uuid) continue;
    // deleteParameterGroup handles parameters and their possible values
    await BlockParameterRepository.deleteParameterGroup(db, block.uuid, group.uuid);
  }

  // Удаляем связи блока
  const [sourceRelations, targetRelations] = await Promise.all([
    db.blocksRelations.where('sourceBlockUuid').equals(block.uuid).toArray(),
    db.blocksRelations.where('targetBlockUuid').equals(block.uuid).toArray()
  ]);
  const allRelations = [...sourceRelations, ...targetRelations];
  for (const relation of allRelations) {
    await BlockRelationRepository.remove(db, relation.uuid);
  }

  //Удаляем вкладки блока
  await BlockTabRepository.deleteTabsForBlock(db, block.uuid); // Updated call

  // Удаляем сам блок
  await db.blocks
      .where('uuid')
      .equals(block.uuid)
      .delete();
  if (db instanceof BookDB) {
    await updateBookLocalUpdatedAt(db as BookDB);
  }
}

const getAll = async (db: BlockAbstractDb): Promise<IBlock[]> => {
  return db.blocks.toArray();
}

const unlinkChildFromParent = async (db: BlockAbstractDb, childBlock: IBlock) => {
  await db.blocks.update(childBlock.id!, {
    ...childBlock,
    parentBlockUuid: null,
    displayKind: 'list'
  });
  if (db instanceof BookDB) {
    await updateBookLocalUpdatedAt(db as BookDB);
  }
}

const linkChildToParent = async (db: BlockAbstractDb, childBlock: IBlock, parentUuid: string) => {
  await db.blocks.update(childBlock.id!, {
    ...childBlock,
    parentBlockUuid: parentUuid,
  });
  if (db instanceof BookDB) {
    await updateBookLocalUpdatedAt(db as BookDB);
  }
}

const getChildren = async (db: BlockAbstractDb, parentBlockUuid: string) => {
  return db.blocks.where('parentBlockUuid').equals(parentBlockUuid).toArray();
}

export const BlockRepository = {
  getAll,
  getByUuid,
  getByUuidList,
  getChildren,
  getSiblings,
  // getParameterGroups, // Moved
  // getParamsByGroup, // Moved
  // getGroupByUuid, // Moved
  // getParamPossibleValues, // Moved
  // getDisplayedParameters, // Moved
  // getDefaultParameters, // Moved
  // getRelatedBlocks, // Moved
  // deleteParameterGroup, // Moved
  // updateParamPossibleValues, // Moved
  save,
  remove,
  unlinkChildFromParent,
  linkChildToParent,
  // getReferencingParametersFromBlock // Moved
}
