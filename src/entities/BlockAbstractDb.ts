import Dexie from "dexie";
import {
  IBlock,
  IBlockParameter,
  IBlockParameterGroup, IBlockParameterPossibleValue, IBlockRelation, IBlockTab,
  IBookConfiguration,
} from "@/entities/ConstructorEntities";

export const baseSchema={
  bookConfigurations: '++id, &uuid, title',
  blocks: '++id, &uuid, configurationUuid, parentBlockUuid, title, sceneLinkAllowed, showInSceneList',
  blockParameterGroups: '++id, &uuid, blockUuid, title',
  blockParameters: '++id, &uuid, groupUuid, blockUuid, dataType, linkedBlockUuid, linkedParameterUuid, isDefault, displayInCard',
  blockParameterPossibleValues: '++id, &uuid, parameterUuid, value',
  blocksRelations: '++id, &uuid, sourceBlockUuid, targetBlockUuid, configurationUuid',
  blockTabs: '++id, &uuid, blockUuid, title, relationUuid',
}

export class BlockAbstractDb extends Dexie{
  bookConfigurations!: Dexie.Table<IBookConfiguration, number>;
  blocks!: Dexie.Table<IBlock, number>;
  blockParameterGroups!: Dexie.Table<IBlockParameterGroup, number>;
  blockParameters!: Dexie.Table<IBlockParameter, number>;
  blockParameterPossibleValues!: Dexie.Table<IBlockParameterPossibleValue, number>;
  blocksRelations!: Dexie.Table<IBlockRelation, number>;
  blockTabs!: Dexie.Table<IBlockTab, number>;

  constructor(dbName:string) {
    super(dbName);
    this.version(2).stores(baseSchema);
  }
}



