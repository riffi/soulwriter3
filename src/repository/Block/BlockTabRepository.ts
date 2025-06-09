// BlockTabRepository.ts
import {BlockAbstractDb} from "@/entities/BlockAbstractDb";
import {IBlockTab, IBlockTabKind, IBlock} from "@/entities/ConstructorEntities";
import {generateUUID} from "@/utils/UUIDUtils";

const deleteTabsForBlock = async (db: BlockAbstractDb, blockUuid: string) => {
  await db.blockTabs.where('blockUuid').equals(blockUuid).delete();
}

const appendDefaultTab = async (db: BlockAbstractDb, blockData: IBlock) => {
  await db.blockTabs.add({
    uuid: generateUUID(),
    blockUuid: blockData.uuid!, // Added non-null assertion
    title: 'Основное',
    orderNumber: 0,
    tabKind: IBlockTabKind.parameters,
    isDefault: 1
  })
}

const getBlockTabs = async (db: BlockAbstractDb, blockUuid: string) => {
  return db.blockTabs.where('blockUuid').equals(blockUuid).sortBy('orderNumber');
};

const saveTab = async (db: BlockAbstractDb, tab: IBlockTab) => {
  if (!tab.uuid) {
    tab.uuid = generateUUID();
    await db.blockTabs.add(tab);
  } else {
    await db.blockTabs.update(tab.id!, tab);
  }
};

const deleteTab = async (db: BlockAbstractDb, uuid: string) => {
  await db.blockTabs.where('uuid').equals(uuid).delete();
};

const moveTab = async (db: BlockAbstractDb, blockUuid: string, uuid: string, direction: 'up' | 'down') => {
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
};

export const BlockTabRepository = {
  appendDefaultTab, // Added
  getBlockTabs,
  saveTab,
  deleteTab,
  moveTab,
  deleteTabsForBlock // Added
};
