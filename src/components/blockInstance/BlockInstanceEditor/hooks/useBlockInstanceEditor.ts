import {bookDb} from "@/entities/bookDb";
import {useLiveQuery} from "dexie-react-hooks";
import {IBlockInstance, IBlockParameterInstance} from "@/entities/BookEntities";
import {
  IBlockParameterGroup,
  IBlockParameter,
  IBlockParameterPossibleValue, IBlock, IBlockRelation, IBlockTab
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

  const relatedBlocks = useLiveQuery<IBlock[]>(() => {
    if (!block || !blockRelations) return []
    return BlockRepository.getRelatedBlocks(bookDb, block, blockRelations)
  },[block, blockRelations])

  const allBlocks = useLiveQuery<IBlock[]>(async () => {
    if (!blockInstance) return [];
    return BlockRepository.getAll(bookDb)
  }, [blockInstance]);


  const referencingParams = useLiveQuery<IBlockParameter[]>(() => {
    if (!block || !blockRelations) return [];
    return bookDb.blockParameters.where("relatedBlockUuid").equals(block.uuid).toArray()
  }, [block, blockRelations])



  //группы параметров блока
  const parameterGroups = useLiveQuery<IBlockParameterGroup[]>(() => {
    if (!blockInstance) return [];
    return BlockRepository.getParameterGroups(bookDb, blockInstance?.blockUuid);
  }, [blockInstance]);

  const blockTabs = useLiveQuery<IBlockTab[]>(() => {
    if (!block) return [];
    return bookDb.blockTabs
    .where("blockUuid")
    .equals(block.uuid)
    .sortBy("orderNumber");
  }, [block]);

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

  const childBlocks = useLiveQuery<IBlock[]>(() => {
    if (!block) return [];
    return bookDb
      .blocks
      .where("parentBlockUuid")
      .equals(block.uuid)
      .toArray();
  }, [block]);

  const childInstancesMap = useLiveQuery<Record<string, IBlockInstance[]>>(async () => {
    const result: Record<string, IBlockInstance[]> = {};
    if (!childBlocks) return result;

    await Promise.all(childBlocks.map(async (childBlock) => {
      result[childBlock.uuid] = await BlockInstanceRepository.getChildInstances(
          bookDb,
          blockInstance?.uuid,
          childBlock.uuid
      );
    }));

    return result;
  }, [childBlocks]);

  const updateBlockInstanceTitle = async (newTitle: string) =>{
    if (!blockInstance) return;
    await bookDb.blockInstances.update(blockInstance.id, {title: newTitle})
  }

  const updateBlockInstanceShortDescription = async (newDescription: string) =>{
    if (!blockInstance) return;
    await bookDb.blockInstances.update(blockInstance.id, {shortDescription: newDescription});
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
    relatedBlocks,
    allBlocks,
    blockRelations,
    childBlocks,
    childInstancesMap,
    blockTabs,
    referencingParams,
    updateBlockInstanceShortDescription
  }
};
