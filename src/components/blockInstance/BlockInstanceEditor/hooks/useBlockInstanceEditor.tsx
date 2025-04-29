import {bookDb} from "@/entities/bookDb";
import {useLiveQuery} from "dexie-react-hooks";
import {IBlockInstance, IBlockParameterInstance} from "@/entities/BookEntities";
import {
  IBlockParameterGroup,
  IBlockParameter,
  IBlockParameterPossibleValue, IBlock, IBlockRelation
} from "@/entities/ConstructorEntities";
import {BlockRepository} from "@/repository/BlockRepository";
import {BlockRelationRepository} from "@/repository/BlockRelationRepository";
import {BlockInstanceRepository} from "@/repository/BlockInstanceRepository";

export const useBlockInstanceEditor = (blockInstanceUuid: string, currentParamGroup: IBlockParameterGroup | null) => {

  //реализация блока
  const blockInstance = useLiveQuery<IBlockInstance>(() => {
    return BlockInstanceRepository.getByUuid(bookDb, blockInstanceUuid);
  }, [blockInstanceUuid]);


  const block = useLiveQuery(() => {
    if (!blockInstance) return null;
    return BlockRepository.getByUuid(bookDb, blockInstance?.blockUuid);
  }, [blockInstance]);

  const blockRelations = useLiveQuery<IBlockRelation[]>(async () => {
    if (!block) return [];
    return BlockRelationRepository.getBlockRelations(bookDb, block.uuid);
  }, [block]);

  const otherBlocks = useLiveQuery<IBlock[]>(() => {
    if (!block || !blockRelations) return []
    return BlockRepository.getRelatedBlocks(bookDb, block, blockRelations)
  },[block, blockRelations])



  //группы параметров блока
  const parameterGroups = useLiveQuery<IBlockParameterGroup[]>(() => {
    if (!blockInstance) return [];
    return BlockRepository.getParameterGroups(bookDb, blockInstance?.blockUuid);
  }, [blockInstance]);

  //значения параметров группы
  const parameterInstances = useLiveQuery<IBlockParameterInstance[]>(() => {
    if (!blockInstance || !currentParamGroup) return [];
    return bookDb.blockParameterInstances.where({
      'blockParameterGroupUuid': currentParamGroup?.uuid,
      'blockInstanceUuid': blockInstance?.uuid
    }).toArray();
  }, [currentParamGroup]);

  //все доступные параметры в группе параметров блока
  const availableParameters = useLiveQuery<IBlockParameter[]>(() => {
    if (!blockInstance || !currentParamGroup) return [];
    return BlockRepository.getParamsByGroup(bookDb, currentParamGroup?.uuid);
  }, [currentParamGroup]);

  const possibleValuesMap = useLiveQuery<Record<string, IBlockParameterPossibleValue[]>>(() => {
    if (!availableParameters) return {};
    const paramUuids = availableParameters.map(p => p.uuid || '');
    return bookDb.blockParameterPossibleValues
    .where('parameterUuid')
    .anyOf(paramUuids)
    .toArray()
    .then(values => {
      return values.reduce((acc, value) => {
        const key = value.parameterUuid;
        if (!acc[key]) acc[key] = [];
        acc[key].push(value);
        return acc;
      }, {} as Record<string, IBlockParameterPossibleValue[]>);
    });
  }, [availableParameters]);

  //параметры, которые еще не используются в данном блоке
  const availableParametersWithoutInstances = useLiveQuery<IBlockParameter[]>(() => {
    if (!availableParameters || !parameterInstances) return availableParameters || [];

    const usedParameterUuids = new Set(parameterInstances.map(pi => pi.blockParameterUuid));
    return availableParameters.filter(param => !usedParameterUuids.has(param.uuid));
  }, [availableParameters, parameterInstances]);

  const updateBlockInstanceTitle = async (newTitle: string) =>{
    if (!blockInstance) return;
    await bookDb.blockInstances.update(blockInstance.id, {title: newTitle})
  }

  return {
    blockInstance,
    block,
    parameterGroups,
    parameterInstances,
    availableParametersWithoutInstances,
    availableParameters,
    updateBlockInstanceTitle,
    possibleValuesMap,
    otherBlocks,
    blockRelations
  }
};
