import moment from 'moment';
import { useEffect } from 'react';
import { inkLuminAPI } from '@/api/inkLuminApi';
import { configDatabase } from '@/entities/configuratorDb';
import { IBook } from '@/entities/BookEntities';

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const useServerSync = (token: string | undefined) => {
    useEffect(() => {
        if (!token) return;

        const syncBooks = async () => {
            try {
                console.log('Starting server sync...');
                const serverResponse = await inkLuminAPI.getBooksList(token);
                if (!serverResponse || !serverResponse.data) {
                    console.error('Failed to get books from server or data is missing');
                    return;
                }

                const serverBooks: IBook[] = serverResponse.data.map((book: any) => ({
                    // Ensure server book structure matches IBook, especially for date fields
                    uuid: book.uuid,
                    title: book.title,
                    author: book.author,
                    form: book.form,
                    genre: book.genre,
                    configurationUuid: book.configurationUuid,
                    configurationTitle: book.configurationTitle,
                    cover: book.cover,
                    kind: book.kind,
                    description: book.description,
                    serverUpdatedAt: book.updatedAt, // Assuming server sends 'updatedAt'
                }));

                const localBooks = await configDatabase.books.toArray();

                for (const serverBook of serverBooks) {
                    if (!serverBook.uuid || !serverBook.serverUpdatedAt) continue;

                    const localBook = localBooks.find(b => b.uuid === serverBook.uuid);

                    if (localBook && localBook.uuid) {
                        const serverDate = moment(serverBook.serverUpdatedAt);
                        const localDate = localBook.localUpdatedAt ? moment(localBook.localUpdatedAt) : moment(0);

                        if (moment(serverDate).unix() > moment(localDate).unix()) {
                            console.log(`Book ${localBook.uuid}: server changes detected.`);
                            await configDatabase.books.where('uuid').equals(localBook.uuid).modify({
                                serverUpdatedAt: serverBook.serverUpdatedAt,
                                syncState: 'serverChanges',
                            });
                        } else if (localBook.syncState !== 'localChanges') {
                            // If server is not newer and no local changes, mark as synced
                            if (localBook.syncState !== 'synced') {
                                console.log(`Book ${localBook.uuid}: marking as synced.`);
                                await configDatabase.books.where('uuid').equals(localBook.uuid).modify({
                                    syncState: 'synced',
                                });
                            }
                        }
                    }
                }
                console.log('Server sync finished.');
            } catch (error) {
                console.error('Error during server sync:', error);
            }
        };

        syncBooks(); // Initial sync
        const intervalId = setInterval(syncBooks, SYNC_INTERVAL);

        return () => {
            clearInterval(intervalId);
        };
    }, [token]);
};
