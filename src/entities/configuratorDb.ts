// Определение базы данных
import Dexie from 'dexie';
import {IBook, INote, INoteGroup} from "@/entities/BookEntities";
import {baseSchema, BlockAbstractDb} from "@/entities/BlockAbstractDb";
import {IGlobalSettings, IOpenRouterModel} from "@/entities/ConstructorEntities";

const schema = {
    ...baseSchema,
    books: '++id, &uuid, title, author, kind, configurationUuid',
    notes: '++id, &uuid, title, tags, noteGroupUuid, bookUuid',
    notesGroups: '++id, &uuid, title, parentUuid, kindCode',
    globalSettings: '++id',
    openRouterModels: '++id, modelName',
}

class ConfigDatabase extends BlockAbstractDb {

    books!: Dexie.Table<IBook, number>;
    notes!: Dexie.Table<INote, number>;
    notesGroups!: Dexie.Table<INoteGroup, number>;
    globalSettings!: Dexie.Table<IGlobalSettings, number>;
    openRouterModels!: Dexie.Table<IOpenRouterModel, number>;
    constructor() {
        super('BlocksDatabase');
        this.version(3).stores(schema);
    }
}

// Экспорт экземпляра базы данных
export const configDatabase = new ConfigDatabase();
