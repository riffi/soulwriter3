import { useLiveQuery } from "dexie-react-hooks";
import { bookDb } from "@/entities/bookDb";
import {
  BlockParameterGroupEntity,
  BlockParameterInstanceEntity,
  BlockParameterEntity,
} from "@/entities/BookEntities";
import { BlockParameterRepository } from "@/entities/BlockParameterRepository";
import { BlockParameterInstanceRepository } from "@/entities/BlockParameterInstanceRepository";
import { BlockParameterGroupRepository } from "@/entities/BlockParameterGroupRepository";
import { IBlockParameterPossibleValue } from "@/entities/ConstructorEntities"; // Added for IBlockParameterPossibleValue

export function useBlockParameters(
  blockInstanceUuid: string,
  blockUuid: string | undefined,
  currentParamGroupUuid: string | undefined
) {
  const parameterGroups = useLiveQuery(
    () =>
      blockUuid
        ? BlockParameterGroupRepository.getParameterGroupsByBlockUuid(blockUuid)
        : Promise.resolve([]),
    [blockUuid],
    []
  );

  const parameterInstances = useLiveQuery(
    () =>
      currentParamGroupUuid
        ? BlockParameterInstanceRepository.getParameterInstances(
            blockInstanceUuid,
            currentParamGroupUuid
          )
        : Promise.resolve([]),
    [blockInstanceUuid, currentParamGroupUuid],
    []
  );

  const availableParameters = useLiveQuery(
    () =>
      currentParamGroupUuid
        ? BlockParameterRepository.getParametersByGroupUuid(currentParamGroupUuid)
        : Promise.resolve([]),
    [currentParamGroupUuid],
    []
  );

  const possibleValuesMap = useLiveQuery<
    Map<string, IBlockParameterPossibleValue[]>
  >(() => {
    if (!availableParameters || availableParameters.length === 0) {
      return new Map();
    }
    const paramUuids = availableParameters.map((p) => p.uuid);
    return bookDb.blockParameterPossibleValues
      .where("parameterUuid")
      .anyOf(paramUuids)
      .toArray()
      .then((values) => {
        return values.reduce((acc, value) => {
          const key = value.parameterUuid;
          if (!acc.has(key)) {
            acc.set(key, []);
          }
          acc.get(key)!.push(value);
          return acc;
        }, new Map<string, IBlockParameterPossibleValue[]>());
      });
  }, [availableParameters], new Map());

  const availableParametersWithoutInstances = useLiveQuery(() => {
    const instanceUuids = new Set(
      parameterInstances.map((inst) => inst.parameterUuid)
    );
    return availableParameters.filter(
      (param) => !instanceUuids.has(param.uuid)
    );
  }, [availableParameters, parameterInstances], []);

  return {
    parameterGroups,
    parameterInstances,
    availableParameters,
    possibleValuesMap,
    availableParametersWithoutInstances,
  };
}
