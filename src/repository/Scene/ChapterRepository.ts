import { BookDB } from "../../entities/bookDb";
import { IChapter } from "../../entities/BookEntities";
import { updateBook } from "@/utils/bookSyncUtils";
import { SceneRepository } from "./SceneRepository"; // For recalculating scene order after chapter deletion

export const getById = async (db: BookDB, chapterId: number): Promise<IChapter | undefined> => {
    return db.chapters.get(chapterId);
};

export const getAll = async (db: BookDB): Promise<IChapter[]> => {
    return db.chapters.orderBy('order').toArray();
};

export const create = async (db: BookDB, chapterData: Pick<IChapter, 'title'>, chapterOnlyMode: boolean): Promise<number | undefined> => {
    const lastChapter = await db.chapters.orderBy('order').last();
    const newChapter: IChapter = {
        title: chapterData.title,
        order: lastChapter ? lastChapter.order + 1 : 1,
    };
    // Ensure 'id' is not part of the object passed to 'add' if it's auto-incrementing
    // Dexie handles auto-incrementing IDs automatically, so explicit deletion of 'id' is not strictly necessary
    // if the IChapter interface marks 'id' as optional (e.g., id?: number).
    // However, to be safe and align with the example:
    delete (newChapter as any).id;
    const newChapterId = await db.chapters.add(newChapter);
    if (newChapterId !== undefined && chapterOnlyMode) {
        const contentSceneId = await SceneRepository.create(db, {
            title: chapterData.title,
            body: '',
            order: 0,
            chapterId: newChapterId,
        } as any);
        if (contentSceneId !== undefined) {
            await db.chapters.update(newChapterId, { contentSceneId });
        }
    }

    await updateBook(db);
    return newChapterId;
};

export const update = async (db: BookDB, chapterId: number, chapterData: Partial<IChapter>): Promise<void> => {
    await db.chapters.update(chapterId, chapterData);
    // If chapter order is updated via this generic update, scene global order might need recalculation.
    if (chapterData.order !== undefined) {
        await SceneRepository.recalculateGlobalOrder(db);
    }
    await updateBook(db);
};

export const remove = async (db: BookDB, chapterId: number): Promise<void> => {
    // Adapted from useChapters.deleteChapter
    const chapter = await db.chapters.get(chapterId);

    // Remove chapter's content scene if it exists
    if (chapter?.contentSceneId !== undefined) {
        await SceneRepository.remove(db, chapter.contentSceneId);
    }

    // Before deleting the chapter, set chapterId to null for all its scenes
    await db.scenes
        .where('chapterId')
        .equals(chapterId)
        .modify({ chapterId: null });

    await db.chapters.delete(chapterId);

    // After scenes are moved to chapterless, their global order needs to be recalculated.
    await SceneRepository.recalculateGlobalOrder(db);
    await updateBook(db);
};

export const reorderChapters = async (db: BookDB, activeId: number, overId: number): Promise<void> => {
    // Adapted from useChapters.reorderChapters
    const allChapters = await db.chapters.orderBy('order').toArray();

    const oldIndex = allChapters.findIndex(chapter => chapter.id === activeId);
    const newIndex = allChapters.findIndex(chapter => chapter.id === overId);

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    // Perform the move in memory
    const [movedItem] = allChapters.splice(oldIndex, 1);
    allChapters.splice(newIndex, 0, movedItem);

    // Prepare updates
    const updates = allChapters.map((chapter, index) => ({
        id: chapter.id!,
        changes: { order: index + 1 }
    }));

    await db.transaction('rw', db.chapters, async () => {
        await Promise.all(
            updates.map(update =>
                db.chapters.update(update.id, update.changes)
            )
        );
    });

    // After chapters are reordered, the global order of scenes needs to be recalculated
    // because scene order depends on chapter order.
    await SceneRepository.recalculateGlobalOrder(db);
    await updateBook(db);
};

export const ChapterRepository = {
    getById,
    getAll,
    create,
    update,
    remove,
    reorderChapters,
};
