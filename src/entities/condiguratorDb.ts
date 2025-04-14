// Определение базы данных
import Dexie from 'dexie';
import {
  IBlock,
  IBookConfiguration,
  IBlockParameter,
  IBlockParameterGroup,
  IBlockParameterPossibleValue, IBookConfigurationVersion,
} from './ConstructorEntities';
import {IBook} from "@/entities/BookEntities";

class ConfigDatabase extends Dexie {
  bookConfigurations!: Dexie.Table<IBookConfiguration, number>;
  configurationVersions!: Dexie.Table<IBookConfigurationVersion, number>;

  blocks!: Dexie.Table<IBlock, number>;

  blockParameterGroups!: Dexie.Table<IBlockParameterGroup, number>;

  blockParameters!: Dexie.Table<IBlockParameter, number>;

  blockParameterPossibleValues!: Dexie.Table<IBlockParameterPossibleValue, number>;

  books!: Dexie.Table<IBook, number>;

  constructor() {
    super('BlocksDatabase');
    this.version(1).stores({
      bookConfigurations: '++id, &uuid, title',
      configurationVersions: '++id, &uuid, configurationUuid, versionNumber, isDraft',
      blocks: '++id, &uuid, configurationVersionUuid, title',
      blockParameterGroups: '++id, &uuid, blockUuid, title',
      blockParameters: '++id, &uuid, groupUuid, dataType, linkedBlockUuid, linkedParameterUuid',
      blockParameterPossibleValues: '++id, &uuid, parameterUuid, value',
      books: '++id, &uuid, title, author, kind, configurationUuid',
    });
  }
}

// Экспорт экземпляра базы данных
export const configDatabase = new ConfigDatabase();
