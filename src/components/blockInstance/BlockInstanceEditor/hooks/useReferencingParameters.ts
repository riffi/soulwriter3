import { useLiveQuery } from "dexie-react-hooks";
import { bookDb } from "@/entities/bookDb";
import { BlockParameterEntity } from "@/entities/BookEntities";
import { BlockParameterRepository } from "@/entities/BlockParameterRepository";

export function useReferencingParameters(blockUuid: string | undefined) {
  const referencingParams = useLiveQuery(
    () =>
      blockUuid
        ? BlockParameterRepository.getReferencingParameters(blockUuid)
        : Promise.resolve([]),
    [blockUuid],
    []
  );

  return {
    referencingParams,
  };
}
