import {bookDb, BookDB} from "@/entities/bookDb";
import {
  IBlockInstance,
  IBlockInstanceRelation,
  IBlockParameterInstance
} from "@/entities/BookEntities";
import {generateUUID} from "@/utils/UUIDUtils";
import {BlockRepository} from "@/repository/BlockRepository";

const getByUuid = async (db: BookDB, blockInstanceUuid: string) => {
  return db.blockInstances.where('uuid').equals(blockInstanceUuid).first();
}

const getBlockInstances = async (db: BookDB, blockUuid: string) => {
  return  db.blockInstances
    .where('blockUuid')
    .equals(blockUuid)
    .toArray();
}

// Получение связанных экземпляров блоков для данного экземпляра блока
// Если для связанных экземпляров блоков задан параметр relatedBlockUuid, то
// он будет использоваться в качестве параметра для фильтрации полученных экземпляров
const getRelatedInstances = async (db: BookDB, blockInstanceUuid: string, relatedBlockUuid?: string) => {
  const [source, target] = await Promise.all([
    db.blockInstanceRelations
      .where('sourceInstanceUuid')
      .equals(blockInstanceUuid)
      .filter(r => !relatedBlockUuid || r.targetBlockUuid === relatedBlockUuid)
      .toArray(),
    db.blockInstanceRelations
      .where('targetInstanceUuid')
      .equals(blockInstanceUuid)
      .filter(r => !relatedBlockUuid || r.sourceBlockUuid === relatedBlockUuid)
      .toArray()
  ]);
  return [...source, ...target]
}

const appendDefaultParams = async (db: BookDB, instance: IBlockInstance)=> {
  const defaultParameters =
      await BlockRepository.getDefaultParameters(db, instance.blockUuid);


  const defaultParameterInstances = []
  for (const defaultParameter of defaultParameters) {
    const blockParameterInstance: IBlockParameterInstance = {
      uuid: generateUUID(),
      blockInstanceUuid: instance.uuid!!,
      blockParameterUuid: defaultParameter.uuid!!,
      blockParameterGroupUuid: defaultParameter.groupUuid,
      value: "",
    }
    defaultParameterInstances.push(blockParameterInstance);
  }
  await db
  .blockParameterInstances
  .bulkAdd(defaultParameterInstances)
}

const create = async (db: BookDB, instance: IBlockInstance)=> {
  db.blockInstances.add(instance);
}

const update = async (db: BookDB, instance: IBlockInstance)=> {
  db.blockInstances.update(instance.id, instance);
}

const remove = async (db: BookDB, instance: IBlockInstance)=> {
  db.blockInstanceRelations.where('sourceInstanceUuid').equals(instance.uuid).delete();
  db.blockInstanceRelations.where('targetInstanceUuid').equals(instance.uuid).delete();
  db.blockParameterInstances.where('blockInstanceUuid').equals(instance.uuid).delete();
  db.blockInstances.delete(instance.id);
}


const getChildInstances = async (db: BookDB, parentInstanceUuid: string, childBlockUuid?: string) => {
  if (!childBlockUuid) {
    return db.blockInstances
      .where('parentInstanceUuid')
      .equals(parentInstanceUuid)
      .toArray();
  }
  return db.blockInstances
    .where('parentInstanceUuid')
    .equals(parentInstanceUuid)
    .filter(i => i.blockUuid === childBlockUuid)
    .toArray()
}

const removeRelation = async (db: BookDB, relation: IBlockInstanceRelation)=> {
  return db.blockInstanceRelations.delete(relation.id)
}

export const BlockInstanceRepository = {
  getByUuid,
  getBlockInstances,
  appendDefaultParams,
  getRelatedInstances,
  getChildInstances,
  create,
  update,
  remove,
  removeRelation,
}
