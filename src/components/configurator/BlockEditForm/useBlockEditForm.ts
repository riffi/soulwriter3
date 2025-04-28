import { useLiveQuery } from 'dexie-react-hooks';
import {IBlock, IBlockParameter, IBlockParameterGroup} from "@/entities/ConstructorEntities";
import {configDatabase} from "@/entities/configuratorDb";
import {generateUUID} from "@/utils/UUIDUtils";
import {notifications} from "@mantine/notifications";
import {bookDb} from "@/entities/bookDb";

export const useBlockEditForm = (blockUuid: string, bookUuid?: string, currentGroupUuid?: string) => {

  const db = bookUuid? bookDb : configDatabase;

  const block = useLiveQuery<IBlock>( () => {
    return db.blocks.where("uuid").equals(blockUuid).first()
  }, [blockUuid])

  const paramGroupList = useLiveQuery<IBlockParameterGroup[]>(() => {
    return db.blockParameterGroups.where("blockUuid").equals(blockUuid).sortBy("orderNumber");
  }, [block])

  const paramList = useLiveQuery<IBlockParameter[]>(() => {
    if (!currentGroupUuid) {
      return []
    }
    return db.blockParameters.where({groupUuid : currentGroupUuid }).toArray();
  }, [currentGroupUuid]);

  const configurationVersion = useLiveQuery(() => {
    if (!block) return undefined
    return db.configurationVersions.where("uuid").equals(block?.configurationVersionUuid).first()
  }, [block?.uuid])

  const configuration = useLiveQuery(() => {
    if (!block) return undefined
    return db.bookConfigurations.where("uuid").equals(configurationVersion?.configurationUuid).first()
  }, [configurationVersion?.uuid])

  const saveBlock = async (blockData: IBlock) => {

    if (!blockData.uuid) {
      blockData.uuid = generateUUID()
      const blockId = await db.blocks.add(blockData)
      const persistedBlockData = await db.blocks.get(blockId)
      await appendDefaultParamGroup(persistedBlockData)
      return
    }
    db.blocks.update(blockData.id, blockData)
  }

  const saveParam = (param: IBlockParameter) => {
    if (!param.id) {
      param.uuid = generateUUID()
      param.groupUuid = currentGroupUuid;
      param.orderNumber = paramList?.length;
      param.blockUuid = blockUuid;
      param.isDefault = param.isDefault ? 1 : 0;
      console.log(param)
      db.blockParameters.add(param);
    }
    else{
      db.blockParameters.update(param.id, param);
    }
  }


  const deleteParam = async (paramId: number) => {
    try {
      await db.blockParameters.delete(paramId);
      notifications.show({
        title: "Успешно",
        message: "Параметр удалён",
      });

      // Update order numbers for remaining parameters in the same group
      if (currentGroupUuid) {
        const remainingParams = await db.blockParameters
        .where('groupUuid')
        .equals(currentGroupUuid)
        .sortBy('orderNumber');

        await Promise.all(
            remainingParams.map((param, index) =>
                db.blockParameters.update(param.id!, {
                  orderNumber: index
                })
            )
        );
      }
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось удалить параметр",
        color: "red",
      });
    }
  };

  const saveParamGroup = async (data: IBlockParameterGroup) => {
    try {
      if (!data.uuid) {
        data.uuid = generateUUID();
        await db.blockParameterGroups.add(data);
        notifications.show({
          title: "Успешно",
          message: `Вкладка "${data.title}" добавлена`,
        });
        return;
      }
      await db.blockParameterGroups.update(data.id, data);
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
    const groups = await db.blockParameterGroups
    .where("blockUuid")
    .equals(blockUuid)
    .sortBy("orderNumber");

    const currentIndex = groups.findIndex(g => g.uuid === groupUuid);
    if (currentIndex <= 0) return;

    const previousGroup = groups[currentIndex - 1];
    const currentGroup = groups[currentIndex];

    await db.blockParameterGroups.update(previousGroup.id!, {
      orderNumber: currentGroup.orderNumber
    });
    await db.blockParameterGroups.update(currentGroup.id!, {
      orderNumber: previousGroup.orderNumber
    });
  }

  const moveGroupDown = async (groupUuid: string) => {
    const groups = await db.blockParameterGroups
    .where("blockUuid")
    .equals(blockUuid)
    .sortBy("orderNumber");

    const currentIndex = groups.findIndex(g => g.uuid === groupUuid);
    if (currentIndex === -1 || currentIndex >= groups.length - 1) return;

    const nextGroup = groups[currentIndex + 1];
    const currentGroup = groups[currentIndex];

    await db.blockParameterGroups.update(nextGroup.id!, {
      orderNumber: currentGroup.orderNumber
    });
    await db.blockParameterGroups.update(currentGroup.id!, {
      orderNumber: nextGroup.orderNumber
    });
  }

  const updateGroupTitle = async (groupUuid: string, newTitle: string) => {
    try {
      const group = await db.blockParameterGroups
      .where('uuid')
      .equals(groupUuid)
      .first();

      if (group) {
        await db.blockParameterGroups.update(group.id!, {
          title: newTitle
        });
        notifications.show({
          title: "Успешно",
          message: `Название вкладки изменено на "${newTitle}"`,
        });
      }
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось изменить название вкладки",
        color: "red",
      });
    }
  };

  const deleteGroup = async (groupUuid: string) => {
    try {
      // Удаляем все параметры, связанные с этой группой
      await db.blockParameters
        .where('groupUuid')
        .equals(groupUuid)
        .delete();

      // Удаляем группу
      await db.blockParameterGroups
        .where('uuid')
        .equals(groupUuid)
        .delete();

      // Обновляем порядковые номера для оставшихся групп
      const remainingGroups = await db.blockParameterGroups
        .where('blockUuid')
        .equals(blockUuid)
        .sortBy('orderNumber');

      await Promise.all(
          remainingGroups.map((group, index) =>
              db.blockParameterGroups.update(group.id!, {
                orderNumber: index
              })
          )
      );

      notifications.show({
        title: "Успешно",
        message: "Вкладка и связанные параметры удалены",
      });
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось удалить вкладку",
      });
    }
  };

  const appendDefaultParamGroup = async (blockData: IBlock) => {
    if (!blockData?.uuid) {
      throw new Error("Block UUID is required");
    }

    const defaultGroup = {
      blockUuid: blockData.uuid,
      uuid: generateUUID(),
      orderNumber: 0,
      description: '',
      title: 'Основное'
    };

    await db.blockParameterGroups.add(defaultGroup);
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
    deleteParam,
    moveGroupUp,
    moveGroupDown,
    updateGroupTitle,
    deleteGroup
  }
}
