// Определение базы данных
import Dexie from 'dexie';
import {IBook} from "@/entities/BookEntities";
import {baseSchema, BlockAbstractDb} from "@/entities/BlockAbstractDb";

const schema = {
    ...baseSchema,
    books: '++id, &uuid, title, author, kind, configurationUuid'
}

class ConfigDatabase extends BlockAbstractDb {

  books!: Dexie.Table<IBook, number>;

  constructor() {
    super('BlocksDatabase');
    this.version(2).stores(schema);
  }
}

// Экспорт экземпляра базы данных
export const configDatabase = new ConfigDatabase();
