import Dexie from "dexie";
import {IBlockInstance, IBlockParameterInstance, IBook, IScene} from "@/entities/BookEntities";
import {
  IBlock,
  IBlockParameter,
  IBlockParameterGroup, IBlockParameterPossibleValue,
  IBookConfiguration, IBookConfigurationVersion
} from "@/entities/ConstructorEntities";

const bookSchema={
  books: '++id, &uuid, title, author, kind, configurationUuid',
  scenes: '++id, title, order, chapterId',
  chapters: '++id, title, order',

  bookConfigurations: '++id, &uuid, title',
  configurationVersions: '++id, &uuid, configurationUuid, versionNumber, isDraft',
  blocks: '++id, &uuid, configurationVersionUuid, title',
  blockParameterGroups: '++id, &uuid, blockUuid, title',
  blockParameters: '++id, &uuid, groupUuid, blockUuid, dataType, linkedBlockUuid, linkedParameterUuid, isDefault',
  blockParameterPossibleValues: '++id, &uuid, parameterUuid, value',

  blockInstances: '++id, &uuid, blockUuid, title',
  blockParameterInstances: '++id, &uuid, blockParameterUuid, blockInstanceUuid, blockParameterGroupUuid',

}

class BookDB extends Dexie{
  scenes!: Dexie.Table<IScene, number>;
  books!: Dexie.Table<IBook, number>;
  chapters!: Dexie.Table<IScene, number>;

  configurationVersions!: Dexie.Table<IBookConfigurationVersion, number>;
  bookConfigurations!: Dexie.Table<IBookConfiguration, number>;
  blocks!: Dexie.Table<IBlock, number>;
  blockParameterGroups!: Dexie.Table<IBlockParameterGroup, number>;
  blockParameters!: Dexie.Table<IBlockParameter, number>;
  blockParameterPossibleValues!: Dexie.Table<IBlockParameterPossibleValue, number>;

  blockInstances!: Dexie.Table<IBlockInstance, number>;
  blockParameterInstances!: Dexie.Table<IBlockParameterInstance, number>;
  constructor(dbName:string) {
    super(dbName);
    this.version(1).stores(bookSchema);
  }
}

let db: BookDB;

const connectToBookDatabase = (uuid:string): BookDB =>{
  if (db){
    closeDBConnection(db)
  }
  db = new BookDB(`book_db_${uuid}`);

  db.open()

  return db;
}

const closeDBConnection = (db)=>{
  db.close();
}

const deleteBookDatabase = async (uuid: string): Promise<void> => {
  const dbName = `book_db_${uuid}`;
  await Dexie.delete(dbName);
}

export {
  connectToBookDatabase,
  db as bookDb,
  deleteBookDatabase
}


