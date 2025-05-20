import {IBlock, IBlockRelation} from "@/entities/ConstructorEntities";

const getRelatedBlockByRelationUuid = (relations: IBlockRelation[], blocks: IBlock[], relationUuid: string) => {
  const relation = relations?.find(r =>
      r.uuid === relationUuid
  )
  if (!relation) {
    return null
  }
  return blocks?.find(block =>
      (block.uuid === relation.sourceBlockUuid)
      || (block.uuid === relation.targetBlockUuid)
  );
}


export const relationUtils = {
  getRelatedBlockByRelationUuid,
}
