import Dexie from "dexie";
import {
  IBlockInstance,
  IBlockInstanceRelation, IBlockInstanceSceneLink,
  IBlockParameterInstance,
  IBook, IChapter,
  IScene, ISceneBody, IBlockInstanceGroup
} from "@/entities/BookEntities";
import {IKnowledgeBasePage} from "@/entities/KnowledgeBaseEntities";
import {baseSchema, BlockAbstractDb} from "@/entities/BlockAbstractDb";


const bookSchema={
  ...baseSchema,
  books: '++id, &uuid, title, author, kind, configurationUuid, chapterOnlyMode, localUpdatedAt, serverUpdatedAt, syncState',
  scenes: '++id, title, order, chapterId',
  chapters: '++id, title, order, contentSceneId',
  sceneBodies: '++id, sceneId',

  blockInstanceGroups: '++id, &uuid, blockUuid, title, order',
  blockInstances: '++id, &uuid, blockUuid, title, parentInstanceUuid, blockInstanceGroupUuid',
  blockParameterInstances: '++id, &uuid, blockParameterUuid, blockInstanceUuid, blockParameterGroupUuid, value',
  blockInstanceRelations: '++id, &uuid, sourceInstanceUuid, targetInstanceUuid, blockRelationUuid, sourceBlockUuid, targetBlockUuid',
  blockInstanceSceneLinks: '++id, &uuid, blockInstanceUuid, sceneId, blockUuid, title',
}

export class BookDB extends BlockAbstractDb{
  scenes!: Dexie.Table<IScene, number>;
  sceneBodies!: Dexie.Table<ISceneBody, number>;
  books!: Dexie.Table<IBook, number>;
  chapters!: Dexie.Table<IChapter, number>;

  blockInstanceRelations!: Dexie.Table<IBlockInstanceRelation, number>;
  blockInstances!: Dexie.Table<IBlockInstance, number>;
  blockInstanceGroups!: Dexie.Table<IBlockInstanceGroup, number>;
  blockParameterInstances!: Dexie.Table<IBlockParameterInstance, number>;
  blockInstanceSceneLinks!: Dexie.Table<IBlockInstanceSceneLink, number>;
  knowledgeBasePages!: Dexie.Table<IKnowledgeBasePage, number>;
  constructor(dbName:string) {
    super(dbName);
    this.version(8).stores(bookSchema).upgrade(async (tx) => {
      await tx.table('books').toCollection().modify(book => {
        if (book.chapterOnlyMode === undefined) {
          book.chapterOnlyMode = 1;
        }
      });
    });
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
  if (db){
    db.close();
  }
}

const deleteBookDatabase = async (uuid: string): Promise<void> => {
  if (db){
    db.close();
  }
  const dbName = `book_db_${uuid}`;
  await Dexie.delete(dbName);
}

export {
  connectToBookDatabase,
  db as bookDb,
  deleteBookDatabase
}



