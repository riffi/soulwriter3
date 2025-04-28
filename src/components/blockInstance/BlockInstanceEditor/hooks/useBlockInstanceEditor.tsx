import {bookDb} from "@/entities/bookDb";
import {useLiveQuery} from "dexie-react-hooks";
import {IBlockInstance, IBlockParameterInstance} from "@/entities/BookEntities";
import {configDatabase} from "@/entities/configuratorDb";
import {IBlockParameterGroup, IBlockParameter} from "@/entities/ConstructorEntities";

export const useBlockInstanceEditor = (blockInstanceUuid: string, currentParamGroup: IBlockParameterGroup | null) => {

  //реализация блока
  const blockInstance = useLiveQuery<IBlockInstance>(() => {
    return bookDb.blockInstances.where('uuid').equals(blockInstanceUuid).first();
  }, [blockInstanceUuid]);


  const block = useLiveQuery(() => {
    if (!blockInstance) return null;
    return bookDb.blocks.where('uuid').equals(blockInstance?.blockUuid).first();
  }, [blockInstance]);

  //группы групп параметров блока
  const parameterGroups = useLiveQuery<IBlockParameterGroup[]>(() => {
    if (!blockInstance) return [];
    return configDatabase.blockParameterGroups
    .where('blockUuid')
    .equals(blockInstance?.blockUuid)
    .sortBy('orderNumber');
  }, [blockInstance]);

  //значения параметров группы
  const parameterInstances = useLiveQuery<IBlockParameterInstance[]>(() => {
    if (!blockInstance || !currentParamGroup) return [];
    return bookDb.blockParameterInstances.where('blockParameterGroupUuid').equals(currentParamGroup?.uuid).toArray();
  }, [currentParamGroup]);

  //все доступные параметры в группе параметров блока
  const availableParameters = useLiveQuery<IBlockParameter[]>(() => {
    if (!blockInstance || !currentParamGroup) return [];
    return bookDb.blockParameters
    .where('groupUuid')
    .equals(currentParamGroup?.uuid)
    .toArray();
  }, [currentParamGroup]);

  //параметры, которые еще не используются в данном блоке
  const availableParametersWithoutInstances = useLiveQuery<IBlockParameter[]>(() => {
    if (!availableParameters || !parameterInstances) return availableParameters || [];

    const usedParameterUuids = new Set(parameterInstances.map(pi => pi.blockParameterUuid));
    return availableParameters.filter(param => !usedParameterUuids.has(param.uuid));
  }, [availableParameters, parameterInstances]);

  return {
    blockInstance,
    block,
    parameterGroups,
    parameterInstances,
    availableParametersWithoutInstances,
    availableParameters
  }
};
