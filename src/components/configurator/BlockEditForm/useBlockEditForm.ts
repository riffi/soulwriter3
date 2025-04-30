import { useLiveQuery } from 'dexie-react-hooks';
import {
  IBlock,
  IBlockParameter,
  IBlockParameterGroup,
  IBlockRelation
} from "@/entities/ConstructorEntities";
import {configDatabase} from "@/entities/configuratorDb";
import {generateUUID} from "@/utils/UUIDUtils";
import {notifications} from "@mantine/notifications";
import {bookDb} from "@/entities/bookDb";
import {BlockRelationRepository} from "@/repository/BlockRelationRepository";
import {ConfigurationRepository} from "@/repository/ConfigurationRepository";
import {BlockRepository} from "@/repository/BlockRepository";

export const useBlockEditForm = (blockUuid: string, bookUuid?: string, currentGroupUuid?: string) => {

  const db = bookUuid? bookDb : configDatabase;

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

  const configurationVersion = useLiveQuery(() => {
    if (!block) return undefined
    return ConfigurationRepository.getVersion(db,block?.configurationVersionUuid)
  }, [block?.uuid])

  const configuration = useLiveQuery(() => {
    if (!block) return undefined
    return ConfigurationRepository.getByUuid(db, configurationVersion?.configurationUuid)
  }, [configurationVersion?.uuid])

  const blockRelations = useLiveQuery<IBlockRelation[]>(() => {
    return BlockRelationRepository.getBlockRelations(db, blockUuid);
  }, [blockUuid]);

  const saveRelation = async (relation: IBlockRelation) => {
    try {
      if (!relation.uuid) {
        relation.uuid = generateUUID();
        await db.blocksRelations.add(relation);
      } else {
        const existing = await db.blocksRelations.where('uuid').equals(relation.uuid).first();
        if (existing) {
          await db.blocksRelations.update(existing.id!, relation);
        }
      }
      notifications.show({
        title: "Успешно",
        message: "Связь сохранена",
      });
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось сохранить связь",
        color: "red",
      });
    }
  };

  const deleteRelation = async (relationUuid: string) => {
    try {
      await db.blocksRelations.where('uuid').equals(relationUuid).delete();
      notifications.show({
        title: "Успешно",
        message: "Связь удалена",
      });
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось удалить связь",
        color: "red",
      });
    }
  };

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

  const childBlocks = useLiveQuery<IBlock[]>(() => {
    return db.blocks.where("parentBlockUuid").equals(blockUuid).toArray();
  }, [blockUuid]);

  const updateBlockParent = async (childBlockUuid: string, parentUuid: string | null) => {
    try {
      const childBlock = await BlockRepository.getByUuid(db, childBlockUuid);
      if (childBlock) {
        await db.blocks.update(childBlock.id!, {
          ...childBlock,
          parentBlockUuid: parentUuid
        });
        notifications.show({
          title: "Успешно",
          message: parentUuid
              ? "Блок добавлен как дочерний"
              : "Блок отвязан",
        });
      }
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось обновить связь",
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
    configurationVersion,
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
    saveRelation,
    deleteRelation,
    childBlocks,
    updateBlockParent
  }
}
