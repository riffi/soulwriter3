import {bookDb, BookDB} from "@/entities/bookDb";
import {
  IBlockInstance,
  IBlockInstanceRelation,
  IBlockParameterInstance
} from "@/entities/BookEntities";
import {generateUUID} from "@/utils/UUIDUtils";
import {BlockRepository} from "@/repository/BlockRepository";
import {IBlock, IBlockParameter} from "@/entities/ConstructorEntities";

const getByUuid = async (db: BookDB, blockInstanceUuid: string) => {
  return db.blockInstances.where('uuid').equals(blockInstanceUuid).first();
}

const getByUuidList = async (db: BookDB, blockInstanceUuidList: string[]) => {
  return db.blockInstances.where('uuid').anyOf(blockInstanceUuidList).toArray();
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

const appendDefaultParam = async (db: BookDB, instance: IBlockInstance, param: IBlockParameter)=> {
  const blockParameterInstance: IBlockParameterInstance = {
    uuid: generateUUID(),
    blockInstanceUuid: instance.uuid!!,
    blockParameterUuid: param.uuid!!,
    blockParameterGroupUuid: param.groupUuid,
    value: "",
  }
  await db
      .blockParameterInstances.add(blockParameterInstance)

  await update(db, instance); // Call the modified update

}
const appendDefaultParams = async (db: BookDB, instance: IBlockInstance)=> {
  // instance.uuid must be defined to fetch parameters and later the instance itself.
  if (!instance.uuid) {
    console.error("BlockInstanceRepository.appendDefaultParams: instance.uuid is undefined.");
    return;
  }
  const defaultParameters = await BlockRepository.getDefaultParameters(db, instance.blockUuid);

  if (defaultParameters.length > 0) {
    const defaultParameterInstances = defaultParameters.map(defaultParameter => ({
      uuid: generateUUID(),
      blockInstanceUuid: instance.uuid!!, // instance.uuid is checked above
      blockParameterUuid: defaultParameter.uuid!!, // defaultParameter.uuid must exist
      blockParameterGroupUuid: defaultParameter.groupUuid,
      value: "",
    }));
    await db.blockParameterInstances.bulkAdd(defaultParameterInstances);
  }

  // Always try to fetch and update the parent instance, even if no params were added,
  // as this function might be called as part of a creation flow (e.g. createSingleInstance)
  // where the instance's own timestamp should be updated.
  // No need to fetch, the instance is passed in
  // const parentInstance = await getByUuid(db, instance.uuid!!); // instance.uuid is checked above
  // if (parentInstance) { // instance is already the parentInstance
  await update(db, instance); // Call the modified update
  // }
};

const create = async (db: BookDB, instance: IBlockInstance)=> {
  const instanceToCreate = {
    ...instance, // Spread incoming instance data first
    uuid: instance.uuid || generateUUID(), // Ensure UUID
    updatedAt: new Date().toISOString(), // Set updatedAt
  };
  // Remove id from instanceToCreate if it exists, as 'add' doesn't want it for auto-increment PKs.
  delete (instanceToCreate as any).id;
  await db.blockInstances.add(instanceToCreate);
};

const createSingleInstance = async (db: BookDB, block: IBlock): Promise<IBlockInstance | undefined> => {
  const newUuid = generateUUID();
  // Prepare data for IBlockInstance. Title is mandatory.
  const newInstanceData: IBlockInstance = {
    uuid: newUuid,
    blockUuid: block.uuid, // block.uuid must exist
    title: block.title || 'Unnamed Instance',
    // other IBlockInstance fields (id, shortDescription, icon, parentInstanceUuid, updatedAt)
    // will be undefined or set by 'create'/'update'
  };

  // 'create' will use newInstanceData.uuid and set updatedAt. It won't set an id.
  await BlockInstanceRepository.create(db, newInstanceData);

  // 'appendDefaultParams' needs an instance object, primarily for its uuid.
  // It will fetch the full instance (which will include an 'id' from the DB) internally before updating.
  await BlockInstanceRepository.appendDefaultParams(db, newInstanceData);

  // Fetch the final state of the instance, which now has an id and the latest updatedAt.
  return getByUuid(db, newUuid);
};

// Обновление инстанса по его UUID
const updateByInstanceUuid = async (db: BookDB, instanceUuid: string, newData: Partial<IBlockInstance>)=> {
  const instanceToUpdate = await getByUuid(db, instanceUuid);
  if (!instanceToUpdate) {
    console.error("BlockInstanceRepository.updateByInstanceUuid: Instance not found.", instanceUuid);
    return;
  }

  // Merge newData into existing data, but keep existing updatedAt.
  const mergedData: IBlockInstance = {
    ...instanceToUpdate, // Spread existing instance data
    ...newData, // Merge in newData
    updatedAt: new Date().toISOString(),
  };

  await db.blockInstances.update(mergedData.id, mergedData)
}

const update = async (db: BookDB, instance: IBlockInstance)=> {
  if (instance.id === undefined) {
    console.error("BlockInstanceRepository.update: Attempted to update an instance without an ID.", instance);
    // Optionally throw an error: throw new Error("Instance ID is required for update.");
    return; // Or handle error appropriately
  }
  const instanceToUpdate = {
    ...instance, // Spread existing instance data
    updatedAt: new Date().toISOString(), // Set/overwrite updatedAt
  };
  await db.blockInstances.update(instance.id, instanceToUpdate);
};

const remove = async (db: BookDB, instance: IBlockInstance)=> {
  await Promise.all([
    db.blockInstanceRelations.where('sourceInstanceUuid').equals(instance.uuid).delete(),
    db.blockInstanceRelations.where('targetInstanceUuid').equals(instance.uuid).delete(),
    db.blockParameterInstances.where('blockInstanceUuid').equals(instance.uuid).delete(),
    db.blockInstanceSceneLinks.where('blockInstanceUuid').equals(instance.uuid).delete(),
    // @todo сейчас удаляются все инстансы параметров, где value === uuid экземпляра, что не очень верно
    db.blockParameterInstances.where('value').equals(instance.uuid).delete(),
    db.blockInstances.delete(instance.id)
  ])
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
  // relation.id must exist for deletion
  if (relation.id === undefined) {
    console.error("BlockInstanceRepository.removeRelation: relation.id is undefined.");
    return; // Or throw an error
  }
  const result = await db.blockInstanceRelations.delete(relation.id);

  const [sourceInstance, targetInstance] = await Promise.all([
    getByUuid(db, relation.sourceInstanceUuid),
    getByUuid(db, relation.targetInstanceUuid)
  ]);

  if (sourceInstance) {
    await update(db, sourceInstance); // Call the modified update
  }
  if (targetInstance) {
    await update(db, targetInstance); // Call the modified update
  }
  return result;
};

const createRelation = async (db: BookDB,
                              sourceInstanceUuid: string,
                              targetInstanceUuid: string,
                              sourceBlockUuid: string,
                              targetBlockUuid: string,
                              blockRelationUuid: string) => {

  const relation: IBlockInstanceRelation = {
    sourceInstanceUuid: sourceInstanceUuid,
    targetInstanceUuid: targetInstanceUuid,
    sourceBlockUuid: sourceBlockUuid,
    targetBlockUuid: targetBlockUuid,
    blockRelationUuid: blockRelationUuid
  };

  const [sourceInstance, targetInstance] = await Promise.all([
    getByUuid(db, relation.sourceInstanceUuid),
    getByUuid(db, relation.targetInstanceUuid)
  ]);

  if (sourceInstance) {
    await update(db, sourceInstance); // Call the modified update
  }
  if (targetInstance) {
    await update(db, targetInstance); // Call the modified update
  }

  await bookDb.blockInstanceRelations.add(relation);
}

const getInstanceParams = async (db: BookDB, instanceUuid: string) => {
  return db.blockParameterInstances
    .where('blockInstanceUuid')
    .equals(instanceUuid)
    .toArray();
}

const removeByBlock = async (db: BookDB, blockUuid: string) => {
  const instances = await BlockInstanceRepository.getBlockInstances(db, blockUuid);
  for (const instance of instances) {
    await remove(db, instance);
  }
}

const addParameterInstance = async (instance: IBlockParameterInstance): Promise<void> => {
  try {
    await bookDb.blockParameterInstances.add(instance);
    // Обновляем родительский инстанс блока
    const blockInstance = await getByUuid(bookDb, instance.blockInstanceUuid);
    if (blockInstance) {
      await update(bookDb, blockInstance);
    }
  } catch (error) {
    console.error("Error adding parameter instance:", error);
    throw error;
  }
};

const updateParameterInstance = async (
    id: number,
    changes: Partial<IBlockParameterInstance>
): Promise<void> => {
  try {
    await bookDb.blockParameterInstances.update(id, changes);
    // Обновляем родительский инстанс блока
    const paramInstance = await bookDb.blockParameterInstances.get(id);
    if (paramInstance) {
      const blockInstance = await getByUuid(bookDb, paramInstance.blockInstanceUuid);
      if (blockInstance) {
        await update(bookDb, blockInstance);
      }
    }
  } catch (error) {
    console.error("Error updating parameter instance:", error);
    throw error;
  }
};

const deleteParameterInstance = async (id: number): Promise<void> => {
  try {
    const paramInstance = await bookDb.blockParameterInstances.get(id);
    if (paramInstance) {
      await bookDb.blockParameterInstances.delete(id);
      // Обновляем родительский инстанс блока
      const blockInstance = await getByUuid(bookDb, paramInstance.blockInstanceUuid);
      if (blockInstance) {
        await update(bookDb, blockInstance);
      }
    }
  } catch (error) {
    console.error("Error deleting parameter instance:", error);
    throw error;
  }
};

export const BlockInstanceRepository = {
  getByUuid,
  getByUuidList,
  getBlockInstances,
  getInstanceParams,
  appendDefaultParams,
  appendDefaultParam,
  getRelatedInstances,
  getChildInstances,
  create,
  createSingleInstance,
  update,
  updateByInstanceUuid,
  remove,
  createRelation,
  removeRelation,
  removeByBlock,
  addParameterInstance,
  updateParameterInstance,
  deleteParameterInstance,
}
