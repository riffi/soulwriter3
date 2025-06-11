import { useLiveQuery } from "dexie-react-hooks";
import { bookDb } from "@/entities/bookDb";
import {
  BlockRelationEntity,
  BlockEntity,
} from "@/entities/BookEntities";
import { BlockRepository } from "@/entities/BlockRepository";
import { BlockRelationRepository } from "@/entities/BlockRelationRepository";

export function useBlockRelations(blockUuid: string | undefined) {
  const blockRelations = useLiveQuery(
    () =>
      blockUuid
        ? BlockRelationRepository.getRelationsForBlock(blockUuid)
        : Promise.resolve([]),
    [blockUuid],
    []
  );

  const relatedBlocks = useLiveQuery(async () => {
    if (!blockUuid || !blockRelations.length) return [];
    const relatedBlockUuids = blockRelations.map((br) =>
      br.block1Uuid === blockUuid ? br.block2Uuid : br.block1Uuid
    );
    return BlockRepository.getBlocksByUuids(relatedBlockUuids);
  }, [blockUuid, blockRelations], []);

  const allBlocks = useLiveQuery(
    () => BlockRepository.getAllBlocks(),
    [],
    []
  );

  return {
    blockRelations,
    relatedBlocks,
    allBlocks,
  };
}
