// useBlockTabsManager.ts
import { BlockTabRepository } from "@/repository/BlockTabRepository";
import { notifications } from "@mantine/notifications";
import {IBlockTab} from "@/entities/ConstructorEntities";
import {bookDb} from "@/entities/bookDb";
import {configDatabase} from "@/entities/configuratorDb";
import {useLiveQuery} from "dexie-react-hooks";

interface UseBlockTabsManagerProps {
  bookUuid: string;
  blockUuid: string;
}

export const useBlockTabsManager = ({ bookUuid, blockUuid }: UseBlockTabsManagerProps) => {

  const db = bookUuid? bookDb : configDatabase;
  const isBookDb = !!bookUuid;

  const tabs = useLiveQuery<IBlockTab[]>(() => {
    return BlockTabRepository.getBlockTabs(db, blockUuid);
  }, [blockUuid]);

  const saveTab = async (tab: IBlockTab) => {
    try {
      await BlockTabRepository.saveTab(db, tab);
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось сохранить вкладку",
        color: "red"
      });
    }
  };

  const deleteTab = async (uuid: string) => {
    await BlockTabRepository.deleteTab(db, uuid);
  };

  const moveTabUp = async (uuid: string) => {
    await BlockTabRepository.moveTab(db, blockUuid, uuid, 'up');
  };

  const moveTabDown = async (uuid: string) => {
    await BlockTabRepository.moveTab(db, blockUuid, uuid, 'down');
  };

  return {
    tabs,
    saveTab,
    deleteTab,
    moveTabUp,
    moveTabDown,
  };
};
