import {BlockAbstractDb} from "@/entities/BlockAbstractDb";
import {
  IBlock,
  IBlockParameter,
  IBlockParameterPossibleValue, IBlockRelation, IBlockTabKind
} from "@/entities/ConstructorEntities";
import {generateUUID} from "@/utils/UUIDUtils";
import {useLiveQuery} from "dexie-react-hooks";
import {bookDb} from "@/entities/bookDb";
import {BlockRelationRepository} from "@/repository/BlockRelationRepository";
import {fetchAndPrepareTitleForms} from "@/api/TextApi";

const getByUuid = async (db: BlockAbstractDb, blockUuid: string) => {
  return db.blocks.where("uuid").equals(blockUuid).first()
}

const getSiblings = async (db: BlockAbstractDb, block: IBlock) => {
  return db.blocks.where(
      {
        configurationVersionUuid: block.configurationVersionUuid
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
    configurationVersionUuid: block?.configurationVersionUuid
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
    title: 'Параметры',
    orderNumber: 0,
    tabKind: IBlockTabKind.parameters,
    isDefault: 1
  })
}

const save = async (db: BlockAbstractDb, block: IBlock) => {
  block.titleForms = await fetchAndPrepareTitleForms(block.title)
  if (!block.uuid) {
    block.uuid = generateUUID()
    const blockId = await db.blocks.add(block)
    const persistedBlockData = await db.blocks.get(blockId)
    await appendDefaultParamGroup(db, persistedBlockData)
    await appendDefaultTab(db, persistedBlockData)
    return block.uuid
  }
  db.blocks.update(block.id, block)
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
        await db.blocksRelations.where('sourceBlockUuid').equals(block.uuid).delete();
        await db.blocksRelations.where('targetBlockUuid').equals(block.uuid).delete();

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


export const BlockRepository = {
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
  remove
}
