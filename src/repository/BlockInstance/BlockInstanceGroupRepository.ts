import {BookDB} from "@/entities/bookDb";
import {IBlockInstanceGroup} from "@/entities/BookEntities";
import {generateUUID} from "@/utils/UUIDUtils";

const getGroups = async (db: BookDB, blockUuid: string) => {
  return db.blockInstanceGroups
    .where('blockUuid')
    .equals(blockUuid)
    .sortBy('order');
};

const saveGroup = async (db: BookDB, group: IBlockInstanceGroup) => {
  if (!group.uuid) {
    group.uuid = generateUUID();
    await db.blockInstanceGroups.add(group);
  } else {
    await db.blockInstanceGroups.update(group.id!, group);
  }
};

const deleteGroup = async (db: BookDB, groupUuid: string) => {
  await db.transaction('rw', db.blockInstanceGroups, db.blockInstances, async () => {
    await db.blockInstances
      .where('blockInstanceGroupUuid')
      .equals(groupUuid)
      .modify({ blockInstanceGroupUuid: undefined });
    await db.blockInstanceGroups.where('uuid').equals(groupUuid).delete();
  });
};

const moveGroupUp = async (db: BookDB, blockUuid: string, uuid: string) => {
  const groups = await getGroups(db, blockUuid);
  const index = groups.findIndex(g => g.uuid === uuid);
  if (index > 0) {
    const prev = groups[index - 1];
    const curr = groups[index];
    await Promise.all([
      db.blockInstanceGroups.update(prev.id!, { order: curr.order }),
      db.blockInstanceGroups.update(curr.id!, { order: prev.order })
    ]);
  }
};

const moveGroupDown = async (db: BookDB, blockUuid: string, uuid: string) => {
  const groups = await getGroups(db, blockUuid);
  const index = groups.findIndex(g => g.uuid === uuid);
  if (index < groups.length - 1 && index >= 0) {
    const curr = groups[index];
    const next = groups[index + 1];
    await Promise.all([
      db.blockInstanceGroups.update(next.id!, { order: curr.order }),
      db.blockInstanceGroups.update(curr.id!, { order: next.order })
    ]);
  }
};

export const BlockInstanceGroupRepository = {
  getGroups,
  saveGroup,
  deleteGroup,
  moveGroupUp,
  moveGroupDown
};
