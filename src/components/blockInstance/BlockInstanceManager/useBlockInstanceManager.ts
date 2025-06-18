import {bookDb} from "@/entities/bookDb";
import {useLiveQuery} from "dexie-react-hooks";
import {IBlockInstance, IBlockParameterInstance, IBlockInstanceGroup} from "@/entities/BookEntities";
import {IBlock, IBlockParameter} from "@/entities/ConstructorEntities";
import {BlockRepository} from "@/repository/Block/BlockRepository";
import {BlockParameterRepository} from "@/repository/Block/BlockParameterRepository"; // Added
import {BlockInstanceRepository} from "@/repository/BlockInstance/BlockInstanceRepository";
import {BlockParameterInstanceRepository} from "@/repository/BlockInstance/BlockParameterInstanceRepository";
import {BlockInstanceGroupRepository} from "@/repository/BlockInstance/BlockInstanceGroupRepository";

export interface IBlockParameterInstanceWithDisplayValue extends IBlockParameterInstance {
  displayValue: string;
}

export interface IBlockInstanceWithParams extends IBlockInstance {
  params: IBlockParameterInstanceWithDisplayValue[];
}


export type TParameterDisplayMode = 'inline' | 'drawer';

export const useBlockInstanceManager = (blockUuid: string, titleSearch?: string) => {

  const block = useLiveQuery<IBlock>(() => {
    return BlockRepository.getByUuid(bookDb, blockUuid);
  }, [blockUuid]);

  const groups = useLiveQuery<IBlockInstanceGroup[]>(() => {
    return BlockInstanceGroupRepository.getGroups(bookDb, blockUuid);
  }, [blockUuid]);

  const instances = useLiveQuery<IBlockInstance[]>(() => {
    return  BlockInstanceRepository.getBlockInstances(bookDb, blockUuid, titleSearch);
  }, [blockUuid, titleSearch]);

  const displayedParameters = useLiveQuery<IBlockParameter[]>(() => {
    return BlockParameterRepository.getDisplayedParameters(bookDb, blockUuid); // Changed to BlockParameterRepository
  }, [blockUuid]);

// Измененный код формирования instancesWithParams
  const instancesWithParams = useLiveQuery<IBlockInstanceWithParams[]>(async () => {
    if (!instances || !displayedParameters) return [];

    const displayParameterUuids = displayedParameters.map(p => p.uuid!);

    // Получаем базовые данные
    const instancesWithParams = await Promise.all(instances.map(async (instance) => {
      const params = await bookDb.blockParameterInstances
          .where('blockInstanceUuid')
          .equals(instance.uuid)
          .filter(p => displayParameterUuids.includes(p.blockParameterUuid))
          .toArray();
      return { ...instance, params };
    }));

    // Собираем UUID всех связанных блоков для blockLink параметров
    const blockLinkUuids = new Set<string>();
    displayedParameters.forEach(param => {
      if (param.dataType === 'blockLink') {
        instancesWithParams.forEach(instance => {
          instance.params.forEach(p => {
            if (p.blockParameterUuid === param.uuid && p.value) {
              blockLinkUuids.add(p.value);
            }
          });
        });
      }
    });

    // Загружаем связанные блоки
    const linkedBlocks = await Promise.all(
        Array.from(blockLinkUuids).map(uuid =>
            BlockInstanceRepository.getByUuid(bookDb, uuid)
        )
    );

    // Создаем словарь UUID -> title
    const uuidToTitle = new Map<string, string>();
    linkedBlocks.forEach(block => {
      if (block) {
        uuidToTitle.set(block.uuid, block.title);
      }
    });

    // Обогащаем параметры displayValue
    return instancesWithParams.map(instance => ({
      ...instance,
      params: instance.params.map(param => {
        const displayedParam = displayedParameters.find(p => p.uuid === param.blockParameterUuid);
        let displayValue: string;
        if (displayedParam?.dataType === 'blockLink') {
          displayValue = uuidToTitle.get(param.value) || '—';
        } else if (param.value instanceof Number) {
          displayValue = `${param.value}`;
        }
        else{
          displayValue = param.value?.replace(/<[^>]*>/g, '') || '—';
        }
        return { ...param, displayValue };
      })
    }));
  }, [instances, displayedParameters]);




  const addBlockInstance = async (data: IBlockInstance) => {
    const instanceId =  await bookDb.blockInstances.add(data);
    await BlockParameterInstanceRepository.appendDefaultParams(bookDb, data);
  }

  const saveGroup = async (group: IBlockInstanceGroup) => {
    await BlockInstanceGroupRepository.saveGroup(bookDb, group);
  };

  const moveGroupUp = async (uuid: string) => {
    await BlockInstanceGroupRepository.moveGroupUp(bookDb, blockUuid, uuid);
  };

  const moveGroupDown = async (uuid: string) => {
    await BlockInstanceGroupRepository.moveGroupDown(bookDb, blockUuid, uuid);
  };

  const deleteGroup = async (uuid: string) => {
    await BlockInstanceGroupRepository.deleteGroup(bookDb, uuid);
  };


  const deleteBlockInstance = async (data: IBlockInstance) => {
    await BlockInstanceRepository.remove(bookDb, data);
  }


  return {
    block,
    instances,
    addBlockInstance,
    groups,
    saveGroup,
    moveGroupUp,
    moveGroupDown,
    deleteGroup,
    deleteBlockInstance,
    instancesWithParams,
    displayedParameters
  }
}
