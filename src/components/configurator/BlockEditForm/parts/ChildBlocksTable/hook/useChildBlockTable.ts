import { useLiveQuery } from 'dexie-react-hooks';
import { IBlock } from "@/entities/ConstructorEntities";
import { configDatabase } from "@/entities/configuratorDb";
import { bookDb } from "@/entities/bookDb";
import { BlockRepository } from "@/repository/BlockRepository";
import { notifications } from "@mantine/notifications";

export const useChildBlocksTable = (blockUuid: string, bookUuid?: string, otherBlocks: IBlock[]) => {
  const db = bookUuid ? bookDb : configDatabase;

  const childrenBlocks = useLiveQuery<IBlock[]>(() => {
    return db.blocks.where("parentBlockUuid").equals(blockUuid).toArray();
  }, [blockUuid]);


  const availableBlocks = otherBlocks?.filter(
      b => !childrenBlocks?.some(child => child.uuid === b.uuid)
  ) || [];

  const addChild = async (childBlockUuid: string, displayKind: string) => {
    try {
      const childBlock = await BlockRepository.getByUuid(db, childBlockUuid);
      if (childBlock) {
        await db.blocks.update(childBlock.id!, {
          ...childBlock,
          parentBlockUuid: blockUuid,
          displayKind
        });
        notifications.show({
          title: "Успешно",
          message: "Дочерний блок добавлен",
        });
      }
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось добавить дочерний блок",
        color: "red",
      });
    }
  };

  const updateChildDisplayKind = async (childBlockUuid: string, displayKind: string) => {
    try {
      const block = await BlockRepository.getByUuid(db, childBlockUuid);
      if (block) {
        await db.blocks.update(block.id!, {
          ...block,
          displayKind
        });
        notifications.show({
          title: "Успешно",
          message: "Настройки блока обновлены",
        });
      }
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось обновить блок",
        color: "red",
      });
    }
  };

  const removeChild = async (childBlockUuid: string) => {
    try {
      const childBlock = await BlockRepository.getByUuid(db, childBlockUuid);
      if (childBlock) {
        await db.blocks.update(childBlock.id!, {
          ...childBlock,
          parentBlockUuid: null,
          displayKind: 'list'
        });
        notifications.show({
          title: "Успешно",
          message: "Дочерний блок удалён",
        });
      }
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось удалить дочерний блок",
        color: "red",
      });
    }
  };

  return {
    childrenBlocks: childrenBlocks || [],
    otherBlocks: otherBlocks || [],
    availableBlocks,
    addChild,
    updateChildDisplayKind,
    removeChild
  };
};
