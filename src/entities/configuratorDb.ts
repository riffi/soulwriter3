// Определение базы данных
import Dexie from 'dexie';
import {IBook, INote, INoteGroup} from "@/entities/BookEntities";
import {baseSchema, BlockAbstractDb} from "@/entities/BlockAbstractDb";

const schema = {
    ...baseSchema,
    books: '++id, &uuid, title, author, kind, configurationUuid',
    notes: '++id, &uuid, title, tags, noteGroupUuid',
    notesGroups: '++id, &uuid, title, parentNoteGroupUuid',
}

class ConfigDatabase extends BlockAbstractDb {

  books!: Dexie.Table<IBook, number>;
  notes!: Dexie.Table<INote, number>;
  notesGroups!: Dexie.Table<INoteGroup, number>;

  constructor() {
    super('BlocksDatabase');
    this.version(2).stores(schema);
  }
}

// Экспорт экземпляра базы данных
export const configDatabase = new ConfigDatabase();
