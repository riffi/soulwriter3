import {bookDb} from "@/entities/bookDb";
import {useLiveQuery} from "dexie-react-hooks";
import {IBlockInstance, IBlockParameterInstance} from "@/entities/BookEntities";
import {configDatabase} from "@/entities/configuratorDb";
import {IBlockParameterGroup} from "@/entities/ConstructorEntities";

export const useBlockInstanceEditor = (blockInstanceUuid: string, currentParamGroup: IBlockParameterGroup) => {
  const blockInstance = useLiveQuery<IBlockInstance>(() =>{
    return bookDb.blockInstances.where('uuid').equals(blockInstanceUuid).first();
  }, [blockInstanceUuid]);

  const parameterGroups= useLiveQuery<IBlockParameterGroup[]>(() => {
    if (!blockInstance) return [];
    return configDatabase.blockParameterGroups
      .where('blockUuid')
      .equals(blockInstance?.blockUuid)
      .sortBy('orderNumber');
  }, [blockInstance]);

  // const parameterInstances = useLiveQuery<IBlockParameterInstance[]>(() => {
  //   return bookDb.blockParameterInstances.where('blockInstanceUuid').equals(blockInstanceUuid).toArray();
  // }, [currentParamGroup])



  return {
    blockInstance,
    parameterGroups
  }
};
