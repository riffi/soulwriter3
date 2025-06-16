import { configDatabase } from '@/entities/configuratorDb';
import { IBook } from '@/entities/BookEntities';
import {useBookStore} from "@/stores/bookStore/bookStore";
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
