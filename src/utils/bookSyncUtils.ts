import { configDatabase } from '@/entities/configuratorDb';
import { IBook } from '@/entities/BookEntities';
import { useBookStore } from "@/stores/bookStore/bookStore";
import { BookDB } from "@/entities/bookDb";
import moment from "moment/moment";

export const updateBookSyncState = async (
    bookUuid: string,
    syncState: IBook['syncState']
) => {
    if (!bookUuid) return;

    try {
        const currentDate = moment().toISOString(true);
        await configDatabase.books.where('uuid').equals(bookUuid).modify({
            localUpdatedAt: currentDate,
            syncState,
        });
    } catch (error) {
        console.error('Error updating book sync state:', error);
    }
};

export const updateBook = async (db: BookDB) => {
    const bookUuid = db.name.replace('book_db_', '');
    await updateBookSyncState(bookUuid, 'localChanges');
};
