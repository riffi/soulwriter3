// useBlockRelationsEditor.ts
import { useLiveQuery } from 'dexie-react-hooks';
import { bookDb } from '@/entities/bookDb';
import { IBlockInstance, IBlockInstanceRelation } from '@/entities/BookEntities';
import { BlockInstanceRepository } from "@/repository/BlockInstance/BlockInstanceRepository";
import { BlockRepository } from "@/repository/Block/BlockRepository";
import {IBlock} from "@/entities/ConstructorEntities";
import {generateUUID} from "@/utils/UUIDUtils";
import {
  BlockInstanceRelationRepository,
  getInstanceRelations
} from "@/repository/BlockInstance/BlockInstanceRelationRepository";

export const useBlockRelationsEditor = (
    blockInstanceUuid: string,
    relatedBlock: IBlock,
    isRelatedBlockTarget: boolean,
    isRelatedBlockChild: boolean,
    parentInstanceUuid: string,
    blockUuid: string
) => {
  const relatedParentInstances = useLiveQuery(
      () => isRelatedBlockChild
          ? BlockInstanceRepository.getBlockInstances(bookDb, relatedBlock.parentBlockUuid!)
          : Promise.resolve([]),
      [relatedBlock, isRelatedBlockChild]
  );

  const relatedParentBlock = useLiveQuery(
      () => isRelatedBlockChild
          ? BlockRepository.getByUuid(bookDb, relatedBlock.parentBlockUuid!)
          : Promise.resolve(null),
      [relatedBlock, isRelatedBlockChild]
  );

  const relatedChildInstances = useLiveQuery(
      () => parentInstanceUuid
          ? BlockInstanceRepository.getChildInstances(bookDb, parentInstanceUuid)
          : Promise.resolve([]),
      [parentInstanceUuid]
  );

  const instanceRelations = useLiveQuery(
      () => BlockInstanceRelationRepository.getInstanceRelations(bookDb, blockInstanceUuid, relatedBlock.uuid),
      [blockInstanceUuid, relatedBlock.uuid]
  );

  const allRelatedInstances = useLiveQuery(
      () => BlockInstanceRepository.getBlockInstances(bookDb, relatedBlock.uuid),
      [relatedBlock.uuid]
  );

  const isInstanceInRelation = (instance: IBlockInstance, relation: IBlockInstanceRelation) =>
      isRelatedBlockTarget
          ? relation.targetInstanceUuid === instance.uuid
          : relation.sourceInstanceUuid === instance.uuid;

  const unusedRelatedInstances = allRelatedInstances?.filter(instance =>
      !instanceRelations?.some(relation => isInstanceInRelation(instance, relation))
  ) || [];

  const createBlockInstanceRelation = async (targetInstanceUuid: string, blockRelationUuid: string) => {
    const [source, target] = isRelatedBlockTarget
        ? [blockInstanceUuid, targetInstanceUuid]
        : [targetInstanceUuid, blockInstanceUuid];

    const sourceBlockUuid = isRelatedBlockTarget ? blockUuid : relatedBlock.uuid;
    const targetBlockUuid = isRelatedBlockTarget ? relatedBlock.uuid : blockUuid;
    await BlockInstanceRelationRepository.createRelation(bookDb,
        source,
        target,
        sourceBlockUuid,
        targetBlockUuid,
        blockRelationUuid);
  };

  return {
    relatedParentInstances,
    relatedParentBlock,
    relatedChildInstances,
    instanceRelations,
    allRelatedInstances,
    unusedRelatedInstances,
    isInstanceInRelation,
    createBlockInstanceRelation
  };
};
