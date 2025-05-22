import { useLiveQuery } from 'dexie-react-hooks';
import {
  IBlock,
  IBlockParameter,
  IBlockParameterGroup,
  IBlockRelation, IBlockStructureKind
} from "@/entities/ConstructorEntities";
import {configDatabase} from "@/entities/configuratorDb";
import {generateUUID} from "@/utils/UUIDUtils";
import {notifications} from "@mantine/notifications";
import {BookDB, bookDb} from "@/entities/bookDb";
import {BlockRelationRepository} from "@/repository/BlockRelationRepository";
import {ConfigurationRepository} from "@/repository/ConfigurationRepository";
import {BlockRepository} from "@/repository/BlockRepository";
import {BlockInstanceRepository} from "@/repository/BlockInstanceRepository";

export const useBlockEditForm = (blockUuid: string, bookUuid?: string, currentGroupUuid?: string) => {

  const db = bookUuid? bookDb : configDatabase;
  const isBookDb = !!bookUuid;

  const block = useLiveQuery<IBlock>( () => {
    if (!blockUuid){
      return
    }
    return BlockRepository.getByUuid(db, blockUuid);
  }, [blockUuid])

  const otherBlocks = useLiveQuery<IBlock[]>(() => {
    if (!block) return []
    return BlockRepository.getSiblings(db,block)
  },[block])

  const paramGroupList = useLiveQuery<IBlockParameterGroup[]>(() => {
    return db.blockParameterGroups.where("blockUuid").equals(blockUuid).sortBy("orderNumber");
  }, [block])

  const paramList = useLiveQuery<IBlockParameter[]>(() => {
    if (!currentGroupUuid) {
      return []
    }
    return db.blockParameters.where({groupUuid : currentGroupUuid }).toArray();
  }, [currentGroupUuid]);


  const configuration = useLiveQuery(() => {
    if (!block) return undefined
    return ConfigurationRepository.getByUuid(db, block.configurationUuid)
  }, [block?.uuid])

  const blockRelations = useLiveQuery<IBlockRelation[]>(() => {
    return BlockRelationRepository.getBlockRelations(db, blockUuid);
  }, [blockUuid]);


  const saveBlock = async (blockData: IBlock) => {
    await BlockRepository.save(db, blockData, isBookDb)
  }

  const saveParam = async (param: IBlockParameter) => {
    if (!param.id) {
      param.uuid = generateUUID()
      param.groupUuid = currentGroupUuid;
      param.orderNumber = paramList?.length;
      param.blockUuid = blockUuid;
      db.blockParameters.add(param);
    } else {

      const prevData = await db.blockParameters.get(param.id)
      db.blockParameters.update(param.id, param);

      // Обновляем значения по умолчанию для одиночных блоков
      if (isBookDb
          && prevData
          && prevData.isDefault === 0 && param.isDefault === 1
      ) {
        const block = await BlockRepository.getByUuid(db, blockUuid);
        if (block?.structureKind === IBlockStructureKind.single) {
          const instances = await BlockInstanceRepository.getBlockInstances(db as BookDB, blockUuid)
          for (const instance of instances) {
            await BlockInstanceRepository.appendDefaultParam(db as BookDB, instance, param)
          }
        }
      }
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
    const groups = await BlockRepository
      .getParameterGroups(db, blockUuid);

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
      const group = await BlockRepository.getGroupByUuid(db, groupUuid)

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
      await BlockRepository.deleteParameterGroup(db, blockUuid, groupUuid);

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


  const loadPossibleValues = async (parameterUuid: string) => {
    return BlockRepository.getParamPossibleValues(db, parameterUuid)
  };

  const savePossibleValues = async (parameterUuid: string, values: string[]) => {
    try {
      await BlockRepository.updateParamPossibleValues(db, parameterUuid, values);

      notifications.show({
        title: "Успешно",
        message: "Значения списка сохранены",
      });
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось сохранить значения списка",
        color: "red",
      });
    }
  };




  return {
    block,
    otherBlocks,
    saveBlock,
    paramGroupList,
    saveParamGroup,
    configuration,
    paramList,
    saveParam,
    deleteParam,
    moveGroupUp,
    moveGroupDown,
    updateGroupTitle,
    deleteGroup,
    loadPossibleValues,
    savePossibleValues,
    blockRelations,
  }
}
