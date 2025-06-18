import { INoteGroup } from "@/entities/BookEntities";
import { configDatabase } from "@/entities/configuratorDb";
import { generateUUID } from "@/utils/UUIDUtils";

const getAll = async (db: typeof configDatabase) => {
  return db.notesGroups.toArray();
};

const getByUuid = async (db: typeof configDatabase, uuid: string) => {
  return db.notesGroups.where('uuid').equals(uuid).first();
};

const getTopLevel = async (db: typeof configDatabase) => {
  return db.notesGroups
    .filter((g) => g.parentUuid === undefined || g.parentUuid === 'topLevel')
    .toArray();
};

const getChildren = async (db: typeof configDatabase, parentUuid: string) => {
  return db.notesGroups.where('parentUuid').equals(parentUuid).toArray();
};

const count = async (db: typeof configDatabase) => db.notesGroups.count();

const create = async (
  db: typeof configDatabase,
  group: Omit<INoteGroup, 'id' | 'uuid'> & { uuid?: string }
) => {
  const newGroup: INoteGroup = {
    ...group,
    uuid: group.uuid || generateUUID(),
    parentUuid: group.parentUuid || 'topLevel',
    kindCode: group.kindCode || 'userGroup',
    order: group.order ?? (await count(db)),
  };
  await db.notesGroups.add(newGroup);
  return newGroup;
};

const update = async (db: typeof configDatabase, group: INoteGroup) => {
  if (!group.id) {
    return create(db, group);
  }
  const existing = await db.notesGroups.get(group.id);
  const updated = { ...existing, ...group } as INoteGroup;
  await db.notesGroups.update(group.id, updated);
  return updated;
};

const remove = async (db: typeof configDatabase, uuid: string) => {
  await db.notesGroups.where('uuid').equals(uuid).delete();
};

const deleteById = async (db: typeof configDatabase, id: number) => {
  await db.notesGroups.delete(id);
};

const clear = async (db: typeof configDatabase) => {
  await db.notesGroups.clear();
};

const bulkAdd = async (db: typeof configDatabase, groups: INoteGroup[]) => {
  if (groups && groups.length > 0) {
    await db.notesGroups.bulkAdd(groups);
  }
};

export const NoteGroupRepository = {
  getAll,
  getByUuid,
  getTopLevel,
  getChildren,
  count,
  create,
  update,
  remove,
  deleteById,
  clear,
  bulkAdd,
};
