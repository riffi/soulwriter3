import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {KnowledgeBaseDrawer} from "./parts/KnowledgeBaseDrawer";
import {SceneAnalysisDrawer} from "./parts/SceneAnalysisDrawer";

import { useMedia } from "@/providers/MediaQueryProvider/MediaQueryProvider";
import { useSceneEditor } from "@/components/scenes/SceneEditor/hooks/useSceneEditor";
import type { SceneEditorProps } from "./types";
import type { IChapter } from "@/entities/BookEntities";
import { ChapterRepository } from "@/repository/Scene/ChapterRepository";
import {IWarningGroup} from "@/components/shared/RichEditor/types";
import {SceneMobileContent} from "@/components/scenes/SceneEditor/parts/SceneMobileContent";
import {SceneDesktopContent} from "@/components/scenes/SceneEditor/parts/SceneDesktopContent";
import {Box, LoadingOverlay} from "@mantine/core";
import {IBlock} from "@/entities/ConstructorEntities";
import {BlockRepository} from "@/repository/Block/BlockRepository";
import {bookDb} from "@/entities/bookDb";
import {useLiveQuery} from "dexie-react-hooks";


export const SceneEditor = ({ sceneId, chapter }: SceneEditorProps) => {
    const navigate = useNavigate();
    const { isMobile } = useMedia();

    const { scene, saveScene } = useSceneEditor(sceneId);
    const chapterData = useLiveQuery<IChapter | undefined>(
        () => {
            const id = chapter?.id ?? scene?.chapterId;
            return id ? ChapterRepository.getById(bookDb, id) : undefined;
        },
        [chapter?.id, scene?.chapterId]
    );
    const handleChapterTitleChange = useCallback(
        (title: string) => {
            if (chapterData?.id) {
                ChapterRepository.update(bookDb, chapterData.id, { title });
            }
        },
        [chapterData?.id]
    );

    const [selectedGroup, setSelectedGroup] = useState<IWarningGroup>();
    const [sceneBody, setSceneBody] = useState("");
    const [warningGroups, setWarningGroups] = useState<IWarningGroup[]>([]);
    const [focusMode, setFocusMode] = useState(false);

    // State for Knowledge Base Drawer
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isAnalysisDrawerOpen, setIsAnalysisDrawerOpen] = useState(false);

    const toggleFocusMode = useCallback(() => setFocusMode((prev) => !prev), []);

    // Functions for Knowledge Base Drawer
    const openKnowledgeBaseDrawer = useCallback(() => setIsDrawerOpen(true), []);
    const openAnalysisDrawer = useCallback(() => setIsAnalysisDrawerOpen(true), []);

    const blocks = useLiveQuery<IBlock[]>(() => BlockRepository.getAll(bookDb), [])

    const closeKnowledgeBaseDrawer = useCallback(() => {
        setIsDrawerOpen(false);
    }, []);
    const closeAnalysisDrawer = useCallback(() => setIsAnalysisDrawerOpen(false), []);

    // Global keyboard shortcut for focus mode
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.key === 'F' && event.shiftKey && (event.ctrlKey || event.metaKey)) ||
                (event.key === 'А' && event.shiftKey && (event.ctrlKey || event.metaKey))) {
                event.preventDefault();
                toggleFocusMode();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [toggleFocusMode]); // Add toggleFocusMode to dependency array


    // Обработчик изменения контента в редакторе
    const handleContentChange = useCallback(
        (contentHTML, contentText) => {
            if (!scene?.id || contentHTML === scene.body) return;
            function cleanForWordCount(text) {
                return text
                    .replace(/\u200B/g, '') // zero-width space
                    .replace(/\u00A0/g, ' ') // non-breaking space → обычный пробел
                    .replace(/\s+$/g, '') // обрезать пробелы в конце
                    .replace(/\r?\n/g, ''); // не считать переводы строк
            }

            const cleanedText = cleanForWordCount(contentText);

            const updatedScene = {
                ...scene,
                body: contentHTML,
                totalSymbolCountWithSpaces: cleanedText.length,
                totalSymbolCountWoSpaces: contentText.replace(/\s+/g, '').length
            };

            saveScene(updatedScene, true);
            setSceneBody(contentHTML);
        },
        [scene, saveScene]
    );
    useEffect(() => {
        setWarningGroups([])
    }, [sceneId])

    // Обновление состояния редактора при изменении текста сцены
    useEffect(() => {
        if (scene?.body !== undefined  && scene.body !== sceneBody) {
            setSceneBody(scene.body);
        }
    }, [sceneId, scene?.id]);

    if (!scene?.id) return null;


    if (scene?.id !== sceneId) {
        return (
            <Box pos="relative" style={{minHeight: "100dvh"}}>
                <LoadingOverlay visible={true} overlayBlur={2} />
            </Box>
        )
    }

    return (
        <>
            {scene?.id === sceneId && (<Box>
                {isMobile ? (
                    <SceneMobileContent
                        chapter={chapterData}
                        onChapterTitleChange={handleChapterTitleChange}
                        sceneBody={sceneBody}
                        handleContentChange={handleContentChange}
                        warningGroups={warningGroups}
                        setWarningGroups={setWarningGroups}
                        selectedGroup={selectedGroup}
                        setSelectedGroup={setSelectedGroup}
                        scene={scene}
                        saveScene={saveScene}
                        focusMode={focusMode}
                        toggleFocusMode={toggleFocusMode}
                        openKnowledgeBaseDrawer={openKnowledgeBaseDrawer}
                        openAnalysisDrawer={openAnalysisDrawer}
                    />
                ) : (
                    <SceneDesktopContent
                        chapter={chapterData}
                        onChapterTitleChange={handleChapterTitleChange}
                        scene={scene}
                        navigate={navigate}
                        saveScene={saveScene}
                        sceneBody={sceneBody}
                        handleContentChange={handleContentChange}
                        warningGroups={warningGroups}
                        setWarningGroups={setWarningGroups}
                        selectedGroup={selectedGroup}
                        setSelectedGroup={setSelectedGroup}
                        focusMode={focusMode}
                        toggleFocusMode={toggleFocusMode}
                        openKnowledgeBaseDrawer={openKnowledgeBaseDrawer}
                        openAnalysisDrawer={openAnalysisDrawer}
                    />
                )}
                <KnowledgeBaseDrawer
                    isOpen={isDrawerOpen}
                    onClose={closeKnowledgeBaseDrawer}
                    blocks={blocks}
                    sceneId={scene.id}
                    sceneBody={scene?.body}
                />
                <SceneAnalysisDrawer
                    isOpen={isAnalysisDrawerOpen}
                    onClose={closeAnalysisDrawer}
                    sceneBody={scene?.body}
                />
            </Box>)
            }
        </>
    );
};
