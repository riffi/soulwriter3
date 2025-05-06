// BlockTabRepository.ts
import {BlockAbstractDb} from "@/entities/BlockAbstractDb";
import {IBlockTab} from "@/entities/ConstructorEntities";
import {generateUUID} from "@/utils/UUIDUtils";

export const BlockTabRepository = {
  getBlockTabs: async (db: BlockAbstractDb, blockUuid: string) => {
    return db.blockTabs.where('blockUuid').equals(blockUuid).sortBy('orderNumber');
  },
  saveTab: async (db: BlockAbstractDb, tab: IBlockTab) => {
    if (!tab.uuid) {
      tab.uuid = generateUUID();
      await db.blockTabs.add(tab);
    } else {
      await db.blockTabs.update(tab.id!, tab);
    }
  },
  deleteTab: async (db: BlockAbstractDb, uuid: string) => {
    await db.blockTabs.where('uuid').equals(uuid).delete();
  },
  moveTab: async (db: BlockAbstractDb, blockUuid: string, uuid: string, direction: 'up' | 'down') => {
    const tabs = await db.blockTabs.where("blockUuid").equals(blockUuid).sortBy("orderNumber");
    const index = tabs.findIndex(t => t.uuid === uuid);
    if (direction === 'up' && index > 0) {
      const [prev, current] = [tabs[index - 1], tabs[index]];
      await Promise.all([
        db.blockTabs.update(prev.id!, { orderNumber: current.orderNumber }),
        db.blockTabs.update(current.id!, { orderNumber: prev.orderNumber }),
      ]);
    }
    if (direction === 'down' && index < tabs.length - 1) {
      const [current, next] = [tabs[index], tabs[index + 1]];
      await Promise.all([
        db.blockTabs.update(next.id!, { orderNumber: current.orderNumber }),
        db.blockTabs.update(current.id!, { orderNumber: next.orderNumber }),
      ]);
    }
  },
};
