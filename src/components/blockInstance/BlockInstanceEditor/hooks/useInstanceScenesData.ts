import { useEffect, useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { bookDb } from '@/entities/bookDb';
import { IBlockInstanceSceneLink, IScene, IChapter } from '@/entities/BookEntities';
import { SceneRepository } from '@/repository/Scene/SceneRepository';
import { ChapterRepository } from '@/repository/Scene/ChapterRepository';

// This interface might be useful for the component consuming the hook
export interface ILinkedSceneDetail {
    link: IBlockInstanceSceneLink;
    scene?: IScene; // Scene might be undefined if not found, though ideally it should exist
}

export interface ISceneTreeNode {
    id: string; // chapter-id or chapter-uncategorized
    title: string;
    scenes: IScene[]; // Scenes not yet linked
    isChapter: boolean;
    chapterObj?: IChapter;
}

export function useInstanceScenesData(blockInstanceUuid: string | undefined) {
    const linkedSceneLinks = useLiveQuery(
        () => blockInstanceUuid ? bookDb.blockInstanceSceneLinks.where({ blockInstanceUuid }).toArray() : Promise.resolve([]),
        [blockInstanceUuid],
        [] // Initial empty array
    );

    const allScenes = useLiveQuery(
        () => SceneRepository.getAll(bookDb),
        [],
        [] // Initial empty array
    );

    const allChapters = useLiveQuery(
        () => ChapterRepository.getAll(bookDb),
        [],
        [] // Initial empty array
    );

    const linkedScenesDetails = useMemo<ILinkedSceneDetail[]>(() => {
        if (!linkedSceneLinks || !allScenes) return [];
        return linkedSceneLinks.map(link => {
            const scene = allScenes.find(s => s.id === link.sceneId);
            return { link, scene };
        });
    }, [linkedSceneLinks, allScenes]);

    const availableScenesTree = useMemo<ISceneTreeNode[]>(() => {
        if (!allChapters || !allScenes || !linkedSceneLinks) return [];

        const nodes: ISceneTreeNode[] = [];
        const scenesByChapterId: Record<string, IScene[]> = {};
        const linkedSceneIds = new Set(linkedSceneLinks.map(l => l.sceneId));

        allScenes.forEach(scene => {
            if (scene.id && !linkedSceneIds.has(scene.id)) {
                const chapterIdKey = scene.chapterId?.toString() || "0"; // "0" for scenes without a chapter
                if (!scenesByChapterId[chapterIdKey]) {
                    scenesByChapterId[chapterIdKey] = [];
                }
                scenesByChapterId[chapterIdKey].push(scene);
            }
        });

        // Sort scenes within each chapter by order
        for (const chapterIdKey in scenesByChapterId) {
            scenesByChapterId[chapterIdKey].sort((a, b) => (a.order || 0) - (b.order || 0));
        }

        allChapters.sort((a,b) => (a.order || 0) - (b.order || 0)).forEach(chapter => {
            const chapterIdStr = chapter.id?.toString();
            if (chapterIdStr && scenesByChapterId[chapterIdStr] && scenesByChapterId[chapterIdStr].length > 0) {
                nodes.push({
                    id: `chapter-${chapter.id}`,
                    title: chapter.title,
                    scenes: scenesByChapterId[chapterIdStr],
                    isChapter: true,
                    chapterObj: chapter,
                });
            }
        });

        if (scenesByChapterId["0"] && scenesByChapterId["0"].length > 0) {
            nodes.push({
                id: 'chapter-uncategorized',
                title: 'Сцены без главы', // Uncategorized scenes
                scenes: scenesByChapterId["0"],
                isChapter: false,
            });
        }
        return nodes;
    }, [allChapters, allScenes, linkedSceneLinks]);

    const isLoading = useMemo(() => {
        return linkedSceneLinks === undefined || allScenes === undefined || allChapters === undefined;
    }, [linkedSceneLinks, allScenes, allChapters]);

    return {
        linkedSceneLinks, // Raw links
        allScenes, // All scenes from repo
        allChapters, // All chapters from repo
        linkedScenesDetails, // Processed linked scenes with details
        availableScenesTree, // Processed tree data for modal
        isLoading, // Loading state
    };
}
