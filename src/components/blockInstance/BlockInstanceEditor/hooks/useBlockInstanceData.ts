import { useLiveQuery } from "dexie-react-hooks";
import { bookDb } from "@/entities/bookDb";
import {
  BlockInstanceEntity,
  BlockEntity,
  BlockTabEntity,
} from "@/entities/BookEntities";
import { BlockRepository } from "@/entities/BlockRepository";
import { BlockInstanceRepository } from "@/entities/BlockInstanceRepository";
import { BlockTabRepository } from "@/entities/BlockTabRepository";

export function useBlockInstanceData(blockInstanceUuid: string) {
  const blockInstance = useLiveQuery(
    () =>
      BlockInstanceRepository.getBlockInstanceByUuid(blockInstanceUuid),
    [blockInstanceUuid],
    null
  );

  const block = useLiveQuery(
    () =>
      blockInstance
        ? BlockRepository.getBlockByUuid(blockInstance.blockUuid)
        : Promise.resolve(null),
    [blockInstance?.blockUuid],
    null
  );

  const blockTabs = useLiveQuery(
    () =>
      block ? BlockTabRepository.getBlockTabs(block.uuid) : Promise.resolve([]),
    [block?.uuid],
    []
  );

  return {
    blockInstance,
    block,
    blockTabs,
  };
}
