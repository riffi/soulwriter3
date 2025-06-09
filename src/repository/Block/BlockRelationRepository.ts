import {BlockAbstractDb} from "@/entities/BlockAbstractDb";
import {generateUUID} from "@/utils/UUIDUtils";
import {IBlockRelation} from "@/entities/ConstructorEntities";

const getBlockRelations = async (db: BlockAbstractDb, blockUuid: string) => {
  const [targetRelations, sourceRelations] = await Promise.all([
    db.blocksRelations.where({ sourceBlockUuid: blockUuid }).toArray(),
    db.blocksRelations.where({ targetBlockUuid: blockUuid }).toArray()
  ]);

  return [...targetRelations, ...sourceRelations];
}

const save = async (db: BlockAbstractDb, relation: IBlockRelation) => {
  if (!relation.uuid) {
    relation.uuid = generateUUID();
    await db.blocksRelations.add(relation);
  } else {
    const existing = await db.blocksRelations.where('uuid').equals(relation.uuid).first();
    if (existing) {
      await db.blocksRelations.update(existing.id!, relation);
    }
  }
}
const remove = async (db: BlockAbstractDb, blockRelationUuid: string) => {
  const relation = await db.blocksRelations.where({ uuid: blockRelationUuid }).first();
  if (!relation) return;

  // Удаляем все связанные вкладки
  const blockTabs = await db.blockTabs.where({ relationUuid: blockRelationUuid }).toArray();
  for (const blockTab of blockTabs) {
    await db.blockTabs.where({ uuid: blockTab.uuid }).delete();
  }

  // Удаляем саму связь
  await db.blocksRelations.where({ uuid: blockRelationUuid }).delete();
}


export const BlockRelationRepository = {
  getBlockRelations,
  remove,
  save
}



