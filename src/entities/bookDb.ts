import Dexie from "dexie";
import {
  IBlockInstance,
  IBlockInstanceRelation,
  IBlockParameterInstance,
  IBook,
  IScene
} from "@/entities/BookEntities";
import {baseSchema, BlockAbstractDb} from "@/entities/BlockAbstractDb";

const bookSchema={
  ...baseSchema,
  books: '++id, &uuid, title, author, kind, configurationUuid',
  scenes: '++id, title, order, chapterId',
  chapters: '++id, title, order',

  blockInstances: '++id, &uuid, blockUuid, title',
  blockParameterInstances: '++id, &uuid, blockParameterUuid, blockInstanceUuid, blockParameterGroupUuid',
  blockInstanceRelations: '++id, &uuid, sourceInstanceUuid, targetInstanceUuid, blockRelationUuid',
}

export class BookDB extends BlockAbstractDb{
  scenes!: Dexie.Table<IScene, number>;
  books!: Dexie.Table<IBook, number>;
  chapters!: Dexie.Table<IScene, number>;

  blockInstanceRelations!: Dexie.Table<IBlockInstanceRelation, number>;
  blockInstances!: Dexie.Table<IBlockInstance, number>;
  blockParameterInstances!: Dexie.Table<IBlockParameterInstance, number>;

  constructor(dbName:string) {
    super(dbName);
    this.version(2).stores(bookSchema);
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


