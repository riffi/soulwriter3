import { useLiveQuery } from 'dexie-react-hooks';
import {IBlock, IBlockParameter, IBlockParameterGroup} from "@/entities/ConstructorEntities";
import {configDatabase} from "@/entities/db";
import {generateUUID} from "@/utils/UUIDUtils";
import {notifications} from "@mantine/notifications";

export const useBlockEditForm = (blockUuid: string, currentGroupUuid?: string) => {
  const block = useLiveQuery<IBlock>( () => {
    return configDatabase.blocks.where("uuid").equals(blockUuid).first()
  }, [blockUuid])

  const paramGroupList = useLiveQuery<IBlockParameterGroup[]>(() => {
    return configDatabase.blockParameterGroups.where("blockUuid").equals(blockUuid).sortBy("orderNumber");
  }, [block])

  const paramList = useLiveQuery<IBlockParameter[]>(() => {
    if (!currentGroupUuid) {
      return []
    }
    return configDatabase.blockParameters.where({groupUuid : currentGroupUuid }).toArray();
  }, [currentGroupUuid]);

  const configurationVersion = useLiveQuery(() => {
    if (!block) return undefined
    return configDatabase.configurationVersions.where("uuid").equals(block?.configurationVersionUuid).first()
  }, [block?.uuid])

  const configuration = useLiveQuery(() => {
    if (!block) return undefined
    return configDatabase.bookConfigurations.where("uuid").equals(configurationVersion?.configurationUuid).first()
  }, [configurationVersion?.uuid])

  const saveBlock = async (blockData: IBlock) => {
    if (!blockData.uuid) {
      blockData.uuid = generateUUID()
      const blockId = await configDatabase.blocks.add(blockData)
      const persistedBlockData = await configDatabase.blocks.get(blockId)
      await appendDefaultParamGroup(persistedBlockData)
      return
    }
    configDatabase.blocks.update(blockData.id, blockData)
  }

  const saveParam = (param: IBlockParameter) => {
    if (!param.id) {
      param.uuid = generateUUID()
      param.groupUuid = currentGroupUuid;
      param.orderNumber = paramList?.length
      configDatabase.blockParameters.add(param);
    }
    else{
      configDatabase.blockParameters.update(param.id, param);
    }
  }

  const saveParamGroup = async (data: IBlockParameterGroup) => {
    try {
      if (!data.uuid) {
        data.uuid = generateUUID();
        await configDatabase.blockParameterGroups.add(data);
        notifications.show({
          title: "Успешно",
          message: `Вкладка "${data.title}" добавлена`,
        });
        return;
      }
      await configDatabase.blockParameterGroups.update(data.id, data);
      notifications.show({
        title: "Успешно",
        message: `Вкладка "${data.title}" обновлена`,
      });
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось сохранить вкладку",
        color: "red",
      });
    }
  }

  const moveGroupUp = async (groupUuid: string) => {
    const groups = await configDatabase.blockParameterGroups
    .where("blockUuid")
    .equals(blockUuid)
    .sortBy("orderNumber");

    const currentIndex = groups.findIndex(g => g.uuid === groupUuid);
    if (currentIndex <= 0) return;

    const previousGroup = groups[currentIndex - 1];
    const currentGroup = groups[currentIndex];

    await configDatabase.blockParameterGroups.update(previousGroup.id!, {
      orderNumber: currentGroup.orderNumber
    });
    await configDatabase.blockParameterGroups.update(currentGroup.id!, {
      orderNumber: previousGroup.orderNumber
    });
  }

  const moveGroupDown = async (groupUuid: string) => {
    const groups = await configDatabase.blockParameterGroups
    .where("blockUuid")
    .equals(blockUuid)
    .sortBy("orderNumber");

    const currentIndex = groups.findIndex(g => g.uuid === groupUuid);
    if (currentIndex === -1 || currentIndex >= groups.length - 1) return;

    const nextGroup = groups[currentIndex + 1];
    const currentGroup = groups[currentIndex];

    await configDatabase.blockParameterGroups.update(nextGroup.id!, {
      orderNumber: currentGroup.orderNumber
    });
    await configDatabase.blockParameterGroups.update(currentGroup.id!, {
      orderNumber: nextGroup.orderNumber
    });
  }

  const appendDefaultParamGroup = async (blockData: IBlock) => {
    await configDatabase.blockParameterGroups.add({
      blockUuid: blockData?.uuid,
      uuid: generateUUID(),
      orderNumber: 0,
      description: '',
      title: 'Основное'
    })
  }

  return {
    block,
    saveBlock,
    paramGroupList,
    saveParamGroup,
    configuration,
    configurationVersion,
    paramList,
    saveParam,
    moveGroupUp,
    moveGroupDown
  }
}
