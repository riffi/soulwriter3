import Dexie from "dexie";
import {
  IBlock,
  IBlockParameter,
  IBlockParameterGroup, IBlockParameterPossibleValue, IBlockRelation, IBlockTab,
  IBookConfiguration, IBookConfigurationVersion
} from "@/entities/ConstructorEntities";

export const baseSchema={
  bookConfigurations: '++id, &uuid, title',
  configurationVersions: '++id, &uuid, configurationUuid, versionNumber, isDraft',
  blocks: '++id, &uuid, configurationVersionUuid, parentBlockUuid, title',
  blockParameterGroups: '++id, &uuid, blockUuid, title',
  blockParameters: '++id, &uuid, groupUuid, blockUuid, dataType, linkedBlockUuid, linkedParameterUuid, isDefault, displayInCard',
  blockParameterPossibleValues: '++id, &uuid, parameterUuid, value',
  blocksRelations: '++id, &uuid, sourceBlockUuid, targetBlockUuid',
  blockTabs: '++id, &uuid, blockUuid, title',
}

export class BlockAbstractDb extends Dexie{
  public configurationVersions!: Dexie.Table<IBookConfigurationVersion, number>;
  bookConfigurations!: Dexie.Table<IBookConfiguration, number>;
  blocks!: Dexie.Table<IBlock, number>;
  blockParameterGroups!: Dexie.Table<IBlockParameterGroup, number>;
  blockParameters!: Dexie.Table<IBlockParameter, number>;
  blockParameterPossibleValues!: Dexie.Table<IBlockParameterPossibleValue, number>;
  blocksRelations!: Dexie.Table<IBlockRelation, number>;
  blockTabs!: Dexie.Table<IBlockTab, number>;

  constructor(dbName:string) {
    super(dbName);
    this.version(1).stores(baseSchema);
  }
}



