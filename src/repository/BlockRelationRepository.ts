import {BlockAbstractDb} from "@/entities/BlockAbstractDb";

const getBlockRelations = async (db: BlockAbstractDb, blockUuid: string) => {
  const [targetRelations, sourceRelations] = await Promise.all([
    db.blocksRelations.where({ sourceBlockUuid: blockUuid }).toArray(),
    db.blocksRelations.where({ targetBlockUuid: blockUuid }).toArray()
  ]);

  return [...targetRelations, ...sourceRelations];
}


export const BlockRelationRepository = {
  getBlockRelations,
}



