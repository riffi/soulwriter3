import { BookDB } from "@/entities/bookDb";
import { IBlockInstance } from "@/entities/BookEntities";
import { generateUUID } from "@/utils/UUIDUtils";
import { BlockRepository } from "@/repository/Block/BlockRepository";
import { BlockParameterInstanceRepository } from "./BlockParameterInstanceRepository";
import { updateBlockInstance } from "./BlockInstanceUpdateHelper";
import {BlockInstanceRelationRepository} from "@/repository/BlockInstance/BlockInstanceRelationRepository";
import { updateBook } from "@/utils/bookSyncUtils";

export const getByUuid = async (db: BookDB, blockInstanceUuid: string) => {
  return db.blockInstances.where('uuid').equals(blockInstanceUuid).first();
}

export const getByUuidList = async (db: BookDB, blockInstanceUuidList: string[]) => {
  return db.blockInstances.where('uuid').anyOf(blockInstanceUuidList).toArray();
}

export const getBlockInstances = async (db: BookDB, blockUuid: string, titleSearch?: string) => {
  let collection = db.blockInstances
      .where('blockUuid')
      .equals(blockUuid);

  if (titleSearch && titleSearch.trim() !== '') {
    collection = collection.filter(instance =>
        instance.title.toLowerCase().includes(titleSearch.trim().toLowerCase())
    );
  }

  return collection.toArray();
}

export const create = async (db: BookDB, instance: IBlockInstance) => {
  const instanceToCreate = {
    ...instance,
    uuid: instance.uuid || generateUUID(),
    updatedAt: new Date().toISOString(),
  };
  delete (instanceToCreate as any).id;
  await db.blockInstances.add(instanceToCreate);
  await updateBook(db);
}

export const createSingleInstance = async (db: BookDB, block: IBlock): Promise<IBlockInstance | undefined> => {
  const newUuid = generateUUID();
  const newInstanceData: IBlockInstance = {
    uuid: newUuid,
    blockUuid: block.uuid,
    title: block.title || 'Unnamed Instance',
  };
  await create(db, newInstanceData);
  await BlockParameterInstanceRepository.appendDefaultParams(db, newInstanceData);
  const created = await getByUuid(db, newUuid);
  await updateBook(db);
  return created;
}

export const update = async (db: BookDB, instance: IBlockInstance) => {
  await updateBlockInstance(db, instance);
  await updateBook(db);
}

export const updateByInstanceUuid = async (db: BookDB, instanceUuid: string, newData: Partial<IBlockInstance>) => {
  const instanceToUpdate = await getByUuid(db, instanceUuid);
  if (!instanceToUpdate) return;

  const mergedData: IBlockInstance = {
    ...instanceToUpdate,
    ...newData,
    updatedAt: new Date().toISOString(),
  };
  await db.blockInstances.update(mergedData.id!, mergedData);
  await updateBook(db);
}

export const remove = async (db: BookDB, instance: IBlockInstance) => {
  await Promise.all([
    BlockInstanceRelationRepository.removeAllForInstance(db, instance.uuid!),
    BlockParameterInstanceRepository.removeAllForInstance(db, instance.uuid!),
    db.blockInstanceSceneLinks.where('blockInstanceUuid').equals(instance.uuid).delete(),
    db.blockInstances.delete(instance.id!)
  ]);
  await updateBook(db);
}

export const getChildInstances = async (db: BookDB, parentInstanceUuid: string, childBlockUuid?: string) => {
  const query = db.blockInstances
      .where('parentInstanceUuid')
      .equals(parentInstanceUuid);

  return childBlockUuid
      ? query.filter(i => i.blockUuid === childBlockUuid).toArray()
      : query.toArray();
}

export const removeByBlock = async (db: BookDB, blockUuid: string) => {
  const instances = await getBlockInstances(db, blockUuid);
  for (const instance of instances) {
    await remove(db, instance);
  }
  await updateBook(db);
}

export const BlockInstanceRepository = {
  getByUuid,
  getByUuidList,
  getBlockInstances,
  create,
  createSingleInstance,
  update,
  updateByInstanceUuid,
  remove,
  getChildInstances,
  removeByBlock,
}
