import {bookDb} from "@/entities/bookDb";
import {useLiveQuery} from "dexie-react-hooks";
import {IBlockInstance, IBlockParameterInstance} from "@/entities/BookEntities";
import {configDatabase} from "@/entities/configuratorDb";
import {IBlockParameterGroup, IBlockParameter} from "@/entities/ConstructorEntities";

export const useBlockInstanceEditor = (blockInstanceUuid: string, currentParamGroup: IBlockParameterGroup | null) => {
  const blockInstance = useLiveQuery<IBlockInstance>(() => {
    return bookDb.blockInstances.where('uuid').equals(blockInstanceUuid).first();
  }, [blockInstanceUuid]);

  const parameterGroups = useLiveQuery<IBlockParameterGroup[]>(() => {
    if (!blockInstance) return [];
    return configDatabase.blockParameterGroups
    .where('blockUuid')
    .equals(blockInstance?.blockUuid)
    .sortBy('orderNumber');
  }, [blockInstance]);

  const parameterInstances = useLiveQuery<IBlockParameterInstance[]>(() => {
    if (!blockInstance || !currentParamGroup) return [];
    return bookDb.blockParameterInstances.where('blockParameterGroupUuid').equals(currentParamGroup?.uuid).toArray();
  }, [currentParamGroup]);

  const availableParameters = useLiveQuery<IBlockParameter[]>(() => {
    if (!blockInstance || !currentParamGroup) return [];
    return bookDb.blockParameters
    .where('groupUuid')
    .equals(currentParamGroup?.uuid)
    .toArray();
  }, [currentParamGroup]);

  // Get parameters that don't have instances yet
  const availableParametersWithoutInstances = useLiveQuery<IBlockParameter[]>(() => {
    if (!availableParameters || !parameterInstances) return availableParameters || [];

    const usedParameterUuids = new Set(parameterInstances.map(pi => pi.blockParameterUuid));
    return availableParameters.filter(param => !usedParameterUuids.has(param.uuid));
  }, [availableParameters, parameterInstances]);

  return {
    blockInstance,
    parameterGroups,
    parameterInstances,
    availableParametersWithoutInstances,
    availableParameters
  }
};
