import { useLiveQuery } from "dexie-react-hooks";
import { bookDb } from "@/entities/bookDb";
import {
  BlockEntity,
  BlockInstanceEntity,
} from "@/entities/BookEntities";
import { BlockRepository } from "@/entities/BlockRepository";
import { BlockInstanceRepository } from "@/entities/BlockInstanceRepository";

export function useBlockChildren(
  blockUuid: string | undefined,
  blockInstanceUuid: string | undefined
) {
  const childBlocks = useLiveQuery(
    () => (blockUuid ? BlockRepository.getChildBlocks(blockUuid) : []),
    [blockUuid],
    []
  );

  const childInstancesMap = useLiveQuery(async () => {
    if (!childBlocks.length || !blockInstanceUuid) {
      return new Map<string, BlockInstanceEntity[]>();
    }
    const map = new Map<string, BlockInstanceEntity[]>();
    for (const childBlock of childBlocks) {
      const instances =
        await BlockInstanceRepository.getBlockInstancesByParentChildUuids(
          blockInstanceUuid,
          childBlock.uuid
        );
      map.set(childBlock.uuid, instances);
    }
    return map;
  }, [childBlocks, blockInstanceUuid], new Map<string, BlockInstanceEntity[]>());

  return {
    childBlocks,
    childInstancesMap,
  };
}
