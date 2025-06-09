import { useLiveQuery } from 'dexie-react-hooks';
import { IBlock } from "@/entities/ConstructorEntities";
import { configDatabase } from "@/entities/configuratorDb";
import { bookDb } from "@/entities/bookDb";
import { BlockRepository } from "@/repository/Block/BlockRepository";
import { notifications } from "@mantine/notifications";

export const useChildBlocksManager = (blockUuid: string, bookUuid?: string, otherBlocks: IBlock[]) => {
  const db = bookUuid ? bookDb : configDatabase;

  const childrenBlocks = useLiveQuery<IBlock[]>(() => {
    return BlockRepository.getChildren(db, blockUuid);
  }, [blockUuid]);


  const availableBlocks = otherBlocks?.filter(
      b => !childrenBlocks?.some(child => child.uuid === b.uuid)
  ) || [];

  const linkChild = async (childBlockUuid: string, displayKind: string) => {
    try {
      const childBlock = await BlockRepository.getByUuid(db, childBlockUuid);
      if (childBlock) {
        await BlockRepository.linkChildToParent(db,
            {
              ...childBlock,
              displayKind
            },
            blockUuid);
        notifications.show({
          title: "Успешно",
          message: "Дочерний блок привязан",
        });
      }
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось привязать дочерний блок",
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

  const unlinkChild = async (childBlockUuid: string) => {
    try {
      const childBlock = await BlockRepository.getByUuid(db, childBlockUuid);
      if (childBlock) {
        await BlockRepository.unlinkChildFromParent(db, childBlock);
        notifications.show({
          title: "Успешно",
          message: "Дочерний блок отвязан",
        });
      }
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось отвязать дочерний блок",
        color: "red",
      });
    }
  };

  return {
    childrenBlocks: childrenBlocks || [],
    otherBlocks: otherBlocks || [],
    availableBlocks,
    linkChild,
    updateChildDisplayKind,
    unlinkChild
  };
};
