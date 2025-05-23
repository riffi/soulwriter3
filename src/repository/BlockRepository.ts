import {BlockAbstractDb} from "@/entities/BlockAbstractDb";
import {
  IBlock,
  IBlockParameter,
  IBlockParameterPossibleValue, IBlockRelation, IBlockStructureKind, IBlockTabKind, IBlockTitleForms
} from "@/entities/ConstructorEntities";
import {generateUUID} from "@/utils/UUIDUtils";
import {useLiveQuery} from "dexie-react-hooks";
import {BookDB, bookDb} from "@/entities/bookDb";
import {BlockRelationRepository} from "@/repository/BlockRelationRepository";
import {InkLuminApi, InkLuminApiError} from "@/api/inkLuminApi";
import {BlockInstanceRepository} from "@/repository/BlockInstanceRepository";
import {notifications} from "@mantine/notifications";

const getByUuid = async (db: BlockAbstractDb, blockUuid: string) => {
  return db.blocks.where("uuid").equals(blockUuid).first()
}

const getSiblings = async (db: BlockAbstractDb, block: IBlock) => {
  return db.blocks.where(
      {
        configurationUuid: block.configurationUuid
      })
  .filter(b => b.uuid !== block.uuid)
  .toArray()
}

const getParameterGroups = async (db: BlockAbstractDb, blockUuid: string) => {
  return db.blockParameterGroups
  .where('blockUuid')
  .equals(blockUuid)
  .sortBy('orderNumber');
}

const getGroupByUuid = async (db: BlockAbstractDb, groupUuid: string) => {
  return db.blockParameterGroups.where('uuid').equals(groupUuid).first();
}

const getParamPossibleValues = async (db: BlockAbstractDb, parameterUuid: string) => {
  return db.blockParameterPossibleValues
  .where('parameterUuid')
  .equals(parameterUuid)
  .sortBy('orderNumber');
};
const getDisplayedParameters = async (db: BlockAbstractDb, blockUuid: string) => {
  return db.blockParameters
  .where('blockUuid')
  .equals(blockUuid)
  .and(param => param.displayInCard === 1)
  .toArray();
}

const getDefaultParameters = async (db: BlockAbstractDb, blockUuid: string) => {
  return db
  .blockParameters
  .where({
    blockUuid,
    isDefault: 1
  })
  .toArray()
}

const getParamsByGroup = async (db: BlockAbstractDb, groupUuid: string) => {
  return db.blockParameters
  .where('groupUuid')
  .equals(groupUuid)
  .toArray();
}

const getRelatedBlocks = async (db: BlockAbstractDb, block: IBlock, blockRelations?: IBlockRelation[]) => {
  const relations: IBlockRelation[] = []
  if (!blockRelations){
    relations.push(...await BlockRelationRepository.getBlockRelations(db, block.uuid));
  }
  else{
    relations.push(...blockRelations)
  }
  return db.blocks.where({
    configurationUuid: block?.configurationUuid
  })
  .filter(b => b.uuid !== block.uuid)
  .filter(b => relations.some(r => r.sourceBlockUuid === b.uuid || r.targetBlockUuid === b.uuid))
  .toArray();
}

const deleteParameterGroup = async (db: BlockAbstractDb, blockUuid: string, groupUuid: string) => {

  // Удаляем все параметры, связанные с этой группой
  await db.blockParameters
  .where('groupUuid')
  .equals(groupUuid)
  .delete();

  // Удаляем группу
  await db.blockParameterGroups
  .where('uuid')
  .equals(groupUuid)
  .delete();

  // Обновляем порядковые номера для оставшихся групп
  const remainingGroups = await db.blockParameterGroups
  .where('blockUuid')
  .equals(blockUuid)
  .sortBy('orderNumber');

  await Promise.all(
      remainingGroups.map((group, index) =>
          db.blockParameterGroups.update(group.id!, {
            orderNumber: index
          })
      )
  );
}

const updateParamPossibleValues = async (db: BlockAbstractDb, parameterUuid: string, possibleValues: IBlockParameterPossibleValue[]) => {
  // Удаляем старые значения
  await db.blockParameterPossibleValues
  .where('parameterUuid')
  .equals(parameterUuid)
  .delete();

  // Сохраняем новые значения
  await Promise.all(
      possibleValues.map((value, index) =>
          db.blockParameterPossibleValues.add({
            uuid: generateUUID(),
            parameterUuid,
            value,
            orderNumber: index,
          })
      )
  );
}

const appendDefaultParamGroup = async (db: BlockAbstractDb, blockData: IBlock) => {
  await db.blockParameterGroups.add({
    blockUuid: blockData.uuid,
    uuid: generateUUID(),
    orderNumber: 0,
    description: '',
    title: 'Основное',
  })
}

const appendDefaultTab = async (db: BlockAbstractDb, blockData: IBlock) => {
  await db.blockTabs.add({
    uuid: generateUUID(),
    blockUuid: blockData.uuid,
    title: 'Основное',
    orderNumber: 0,
    tabKind: IBlockTabKind.parameters,
    isDefault: 1
  })
}

// Создание блока
const create = async (db: BlockAbstractDb, block: IBlock, isBookDb = false, titleForms?: IBlockTitleForms) => {
  if (titleForms) {
    block.titleForms = titleForms;
  } else {
    try {
      block.titleForms = await InkLuminApi.fetchAndPrepareTitleForms(block.title);
    } catch (error) {
      if (error instanceof InkLuminApiError) {
        throw error; // Re-throw the specific API error
      }
      // Handle other potential errors or re-throw them as generic errors
      throw new Error(`Failed to prepare title forms during block creation: ${error.message}`);
    }
  }
  block.uuid = generateUUID()
  const blockId = await db.blocks.add(block)
  const persistedBlockData = await db.blocks.get(blockId)
  await appendDefaultParamGroup(db, persistedBlockData)
  await appendDefaultTab(db, persistedBlockData)

  // Если это книжная БД, создаем инстанс блока
  if (isBookDb && block.structureKind === 'single'){
    await BlockInstanceRepository.createSingleInstance(db as BookDB, block)
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
      block.titleForms = await InkLuminApi.fetchAndPrepareTitleForms(block.title);
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
  await db.transaction('rw',
      [
        db.blocks,
        db.blockParameterGroups,
        db.blockParameters,
        db.blockTabs,
        db.blocksRelations,
        db.blockParameterPossibleValues
      ],
      async () => {
        // Получаем все группы параметров блока
        const groups = await db.blockParameterGroups
        .where('blockUuid')
        .equals(block.uuid)
        .toArray();

        // Для каждой группы получаем параметры
        for (const group of groups) {
          if (!group.uuid) continue;

          const parameters = await db.blockParameters
          .where('groupUuid')
          .equals(group.uuid)
          .toArray();

          // Для каждого параметра удаляем возможные значения
          for (const parameter of parameters) {
            if (!parameter.uuid) continue;

            await db.blockParameterPossibleValues
            .where('parameterUuid')
            .equals(parameter.uuid)
            .delete();
          }

          // Удаляем параметры группы
          await db.blockParameters
          .where('groupUuid')
          .equals(group.uuid)
          .delete();
        }

        // Удаляем группы параметров блока
        await db.blockParameterGroups
        .where('blockUuid')
        .equals(block.uuid)
        .delete();

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
        await db.blockTabs.where('blockUuid').equals(block.uuid).delete();

        // Удаляем сам блок
        await db.blocks
        .where('uuid')
        .equals(block.uuid)
        .delete();
      }
  );
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
}

const linkChildToParent = async (db: BlockAbstractDb, childBlock: IBlock, parentUuid: string) => {
  await db.blocks.update(childBlock.id!, {
    ...childBlock,
    parentBlockUuid: parentUuid,
  });
}

const getChildren = async (db: BlockAbstractDb, parentBlockUuid: string) => {
  return db.blocks.where('parentBlockUuid').equals(parentBlockUuid).toArray();
}

export const BlockRepository = {
  getAll,
  getByUuid,
  getSiblings,
  getParameterGroups,
  getParamsByGroup,
  getGroupByUuid,
  getParamPossibleValues,
  getDisplayedParameters,
  getDefaultParameters,
  getRelatedBlocks,
  deleteParameterGroup,
  updateParamPossibleValues,
  save,
  remove,
  unlinkChildFromParent,
  linkChildToParent,
  getChildren
}
