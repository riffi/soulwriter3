import { BookDB } from "@/entities/bookDb";
import { IScene } from "@/entities/BookEntities";
import {BlockInstanceSceneLinkRepository} from "@/repository/BlockInstance/BlockInstanceSceneLinkRepository";

export const getById = async (db: BookDB, sceneId: number): Promise<IScene | undefined> => {
    return db.scenes.get(sceneId);
};

export const getAll = async (db: BookDB): Promise<IScene[]> => {
    return db.scenes.orderBy('order').toArray();
};

export const getByChapterId = async (db: BookDB, chapterId: number): Promise<IScene[]> => {
    return db.scenes.where('chapterId').equals(chapterId).toArray();
};

export const create = async (db: BookDB, sceneData: IScene): Promise<number | undefined> => {
    const sceneToCreate = { ...sceneData };
    // Ensure 'id' is not part of the object passed to 'add' if it's auto-incrementing
    delete (sceneToCreate as any).id;

    // Add default order if not provided, though recalculateGlobalOrder will handle it
    // The original useScenes.createScene set order to 0 and then called recalculateGlobalOrder
    // We will replicate that initial part. recalculateGlobalOrder will assign the correct order.
    sceneToCreate.order = sceneToCreate.order === undefined ? 0 : sceneToCreate.order;

    const newSceneId = await db.scenes.add(sceneToCreate);
    if (newSceneId !== undefined) {
        await recalculateGlobalOrder(db, { id: newSceneId, newChapterId: sceneData.chapterId ?? null });
    }
    return newSceneId;
};

export const update = async (db: BookDB, sceneId: number, sceneData: Partial<IScene>): Promise<void> => {
    const existingScene = await getById(db, sceneId);
    if (!existingScene) {
        console.error(`Scene with id ${sceneId} not found for update.`);
        return; // Or throw an error
    }

    await db.scenes.update(sceneId, sceneData);

    // Check if order or chapterId changed and if recalculation is needed
    const newOrder = sceneData.order;
    const newChapterId = sceneData.chapterId;

    const orderChanged = newOrder !== undefined && newOrder !== existingScene.order;
    // Ensure null and undefined are treated consistently for chapterId comparison
    const chapterIdChanged = newChapterId !== undefined && (newChapterId ?? null) !== (existingScene.chapterId ?? null);

    if (orderChanged || chapterIdChanged) {
        // If newChapterId was part of sceneData, use it, otherwise use existing scene's chapterId.
        // The newChapterId for recalculateGlobalOrder should be the chapter the scene is *now* in.
        const effectiveChapterId = newChapterId !== undefined ? newChapterId : existingScene.chapterId;
        await recalculateGlobalOrder(db, { id: sceneId, newChapterId: effectiveChapterId ?? null });
    }
};

export const remove = async (db: BookDB, sceneId: number): Promise<void> => {
    // Note: The original useScenes.deleteScene did not explicitly handle unlinking from chapters.
    // This was seemingly handled by useChapters.deleteChapter which moves scenes to root.
    // For now, we replicate the simple delete. If cascading deletes or unlinking is needed here,
    // it would be an adjustment.
    // However, recalculateGlobalOrder should handle fixing orders after a scene is removed.
    const sceneToRemove = await getById(db, sceneId);
    if (!sceneToRemove) return;

    await db.transaction('rw', db.scenes, db.blockInstanceSceneLinks, async () => {
        await db.scenes.delete(sceneId);
        // Also remove related data like links (e.g., blockInstanceSceneLinks)
        await BlockInstanceSceneLinkRepository.removeLinksForScene(db, sceneId);
    });

    // Recalculate order for the chapter the scene belonged to, or globally if it was chapterless
    await recalculateGlobalOrder(db); // Recalculate all orders
};

export const updateOrder = async (db: BookDB, sceneId: number, newOrder: number): Promise<void> => {
    // This function updates a single scene's order.
    // It's crucial that after such an update, the global order is recalculated
    // to ensure consistency across all scenes, especially if this newOrder value
    // could conflict with existing orders or create gaps.
    await db.scenes.update(sceneId, { order: newOrder });
    await recalculateGlobalOrder(db); // Ensure data integrity
};

// New function to swap the 'order' property of two scenes
export const swapOrder = async (db: BookDB, activeId: number, overId: number): Promise<void> => {
    const activeScene = await db.scenes.get(activeId);
    const overScene = await db.scenes.get(overId);

    if (!activeScene || !overScene) {
        console.error("Cannot swap order: one or both scenes not found", { activeId, overId });
        // Consider throwing an error here or handling it more gracefully
        return;
    }

    const activeOrder = activeScene.order;
    const overOrder = overScene.order;

    // Prevent unnecessary writes if orders are somehow already the same
    if (activeOrder === overOrder) {
        return;
    }

    await db.transaction('rw', db.scenes, async () => {
        await db.scenes.update(activeId, { order: overOrder });
        await db.scenes.update(overId, { order: activeOrder });
    });
    // After a direct swap, it's possible that the overall order list might need adjustments
    // if other scenes' orders are expected to shift.
    // However, if this is a simple 1-to-1 swap of order numbers, this might be sufficient.
    // For drag-and-drop, often a full recalculateGlobalOrder is safer after the swap.
    // The prompt suggests this might be called by reorderScenes in useScenes.tsx,
    // which might then decide if a full recalculation is needed.
    // Let's call recalculateGlobalOrder to ensure consistency after a swap.
    await recalculateGlobalOrder(db);
};

export const recalculateGlobalOrder = async (
    db: BookDB,
    movedScene?: { id: number; newChapterId: number | null }
): Promise<void> => {
    // Adapted from useScenes.recalculateGlobalOrder
    const allScenes = await db.scenes.orderBy('order').toArray();

    let scenesToProcess = [...allScenes];
    let movedSceneData: IScene | undefined;

    if (movedScene && movedScene.id) {
        movedSceneData = scenesToProcess.find(s => s.id === movedScene.id);
        if (movedSceneData) {
            // Temporarily remove from list to re-insert it later
            scenesToProcess = scenesToProcess.filter(s => s.id !== movedScene.id);
            // Update chapterId for the moved scene
            movedSceneData.chapterId = movedScene.newChapterId;
        }
    }

    // Group scenes by chapterId and also collect chapterless scenes
    const scenesByChapter: Record<string, IScene[]> = {};
    const chapterlessScenes: IScene[] = [];

    for (const scene of scenesToProcess) {
        if (scene.chapterId !== null && scene.chapterId !== undefined) {
            if (!scenesByChapter[scene.chapterId]) {
                scenesByChapter[scene.chapterId] = [];
            }
            scenesByChapter[scene.chapterId].push(scene);
        } else {
            chapterlessScenes.push(scene);
        }
    }

    // If a scene was moved, add it to its new chapter group or chapterless group
    if (movedSceneData) {
        if (movedSceneData.chapterId !== null && movedSceneData.chapterId !== undefined) {
            if (!scenesByChapter[movedSceneData.chapterId]) {
                scenesByChapter[movedSceneData.chapterId] = [];
            }
            // Add to the end of its new chapter group
            scenesByChapter[movedSceneData.chapterId].push(movedSceneData);
        } else {
            // Add to the end of chapterless scenes
            chapterlessScenes.push(movedSceneData);
        }
    }

    let currentGlobalOrder = 1;
    const updates: Promise<any>[] = [];

    // Process scenes within each chapter
    const sortedChapterIds = Object.keys(scenesByChapter).map(Number).sort((a,b) => {
        const chapterA = db.chapters.get(a);
        const chapterB = db.chapters.get(b);
        // This sort is problematic as db.chapters.get is async.
        // For now, we'll sort by chapterId numerically, assuming chapter order is handled elsewhere or chapter objects are fetched first.
        // A more robust solution would involve fetching chapters and their orders first.
        // For now, we rely on the existing order of scenes within chapters if not moving chapters themselves.
        return a - b; // Simplified sorting
    });

    // To correctly order chapters, we should fetch them first
    const allChapters = await db.chapters.orderBy('order').toArray();
    const chapterOrderMap = new Map(allChapters.map(ch => [ch.id, ch.order]));

    sortedChapterIds.sort((a, b) => (chapterOrderMap.get(a) ?? Infinity) - (chapterOrderMap.get(b) ?? Infinity));


    for (const chapterId of sortedChapterIds) {
        const chapterScenes = scenesByChapter[chapterId];
        // Sort scenes within the chapter by their existing order, if stable sort is desired for non-moved items
        // For simplicity, if not moved, their relative order is preserved by iterating through `scenesToProcess`
        // When moving, the scene is added to the end.
        for (const scene of chapterScenes) {
            if (scene.order !== currentGlobalOrder || (movedSceneData && scene.id === movedSceneData.id)) {
                updates.push(db.scenes.update(scene.id!, { order: currentGlobalOrder, chapterId: scene.chapterId }));
            }
            currentGlobalOrder++;
        }
    }

    // Process chapterless scenes
    // Sort chapterless scenes by their existing order if stable sort is desired
    for (const scene of chapterlessScenes) {
        if (scene.order !== currentGlobalOrder || (movedSceneData && scene.id === movedSceneData.id)) {
            updates.push(db.scenes.update(scene.id!, { order: currentGlobalOrder, chapterId: null }));
        }
        currentGlobalOrder++;
    }

    await db.transaction('rw', db.scenes, async () => {
        await Promise.all(updates);
    });
};

export const addSceneToChapter = async (db: BookDB, sceneId: number, chapterId: number): Promise<void> => {
    // Adapted from useChapters.addSceneToChapter
    await db.scenes.update(sceneId, { chapterId });
    // After changing a scene's chapter, orders need recalculation.
    await recalculateGlobalOrder(db, { id: sceneId, newChapterId: chapterId });
};

export const removeSceneFromChapter = async (db: BookDB, sceneId: number): Promise<void> => {
    // Adapted from useChapters.removeSceneFromChapter
    await db.scenes.update(sceneId, { chapterId: null });
    // After removing a scene from a chapter (making it chapterless), orders need recalculation.
    await recalculateGlobalOrder(db, { id: sceneId, newChapterId: null });
};

export const SceneRepository = {
    getById,
    getAll,
    getByChapterId,
    create,
    update,
    remove,
    updateOrder,
    swapOrder, // Add new function here
    recalculateGlobalOrder,
    addSceneToChapter,
    removeSceneFromChapter,
};
