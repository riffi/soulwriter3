import {bookDb} from "@/entities/bookDb";
import {useLiveQuery} from "dexie-react-hooks";
import {IBlockInstance, IBlockParameterInstance} from "@/entities/BookEntities";
import {IBlock, IBlockParameter} from "@/entities/ConstructorEntities";
import {generateUUID} from "@/utils/UUIDUtils";
import {BlockRepository} from "@/repository/BlockRepository";
import {BlockInstanceRepository} from "@/repository/BlockInstanceRepository";

export interface IBlockInstanceWithParams extends IBlockInstance {
  params: IBlockParameterInstance[];
}

export const useBlockInstanceManager = (blockUuid: string) => {

  const block = useLiveQuery<IBlock>(() => {
    return BlockRepository.getByUuid(bookDb, blockUuid);
  }, [blockUuid]);

  const instances = useLiveQuery<IBlockInstance[]>(() => {
    return  BlockInstanceRepository.getBlockInstances(bookDb, blockUuid);
  }, [blockUuid]);

  const displayedParameters = useLiveQuery<IBlockParameter[]>(() => {
    return BlockRepository.getDisplayedParameters(bookDb, blockUuid);
  }, [blockUuid]);

  const instancesWithParams = useLiveQuery<IBlockInstanceWithParams[]>(async () => {
    if (!instances || !displayedParameters) return [];

    // Получаем UUID параметров, которые нужно отображать
    const displayParameterUuids = displayedParameters.map(p => p.uuid!);

    return Promise.all(instances.map(async (instance) => {
      // Фильтруем параметры инстанса по нужным UUID
      const params = await bookDb.blockParameterInstances
      .where('blockInstanceUuid')
      .equals(instance.uuid)
      .filter(p => displayParameterUuids.includes(p.blockParameterUuid))
      .toArray();

      return { ...instance, params };
    }));
  }, [instances, displayedParameters]); // Добавляем зависимость от blockParameters




  const addBlockInstance = async (data: IBlockInstance) => {
    const instanceId =  await bookDb.blockInstances.add(data);
    await BlockInstanceRepository.appendDefaultParams(bookDb, data);
  }

  const updateBlockInstance = async (data: IBlockInstance) => {
    await bookDb.blockInstances.put(data);
  }

  const deleteBlockInstance = async (data: IBlockInstance) => {
    await bookDb.blockParameterInstances.where('blockInstanceUuid').equals(data.uuid).delete();
    await bookDb.blockInstances.delete(data.id);
  }


  return {
    block,
    instances,
    addBlockInstance,
    updateBlockInstance,
    deleteBlockInstance,
    instancesWithParams,
    displayedParameters
  }
}
