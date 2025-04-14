import Dexie from "dexie";
import {IScene} from "@/entities/BookEntities";
import {
  IBlock,
  IBlockParameter,
  IBlockParameterGroup, IBlockParameterPossibleValue,
  IBookConfiguration
} from "@/entities/ConstructorEntities";

const bookSchema={
  books: '++id, &uuid, title, author, kind, configurationUuid',
  scenes: '++id, title, order, chapterId',
  chapters: '++id, title, order',
  bookConfiguration: '++id, &uuid, title',
  configurationVersions: '++id, &uuid, configurationUuid, versionNumber, isDraft',
  blocks: '++id, &uuid, configurationVersionUuid, title',
  blockParameterGroups: '++id, &uuid, blockUuid, title',
  blockParameters: '++id, &uuid, groupUuid, dataType, linkedBlockUuid, linkedParameterUuid',
  blockParameterPossibleValues: '++id, &uuid, parameterUuid, value',
}

class BookDB extends Dexie{
  scenes!: Dexie.Table<IScene, number>;
  chapters!: Dexie.Table<IScene, number>;
  configurationVersions!: Dexie.Table<IBookConfigurationVersion, number>;
  bookConfiguration!: Dexie.Table<IBookConfiguration, number>;
  blocks!: Dexie.Table<IBlock, number>;
  blockParameterGroups!: Dexie.Table<IBlockParameterGroup, number>;
  blockParameters!: Dexie.Table<IBlockParameter, number>;
  blockParameterPossibleValues!: Dexie.Table<IBlockParameterPossibleValue, number>;
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

export {
  connectToBookDatabase,
  db as bookDb
}


