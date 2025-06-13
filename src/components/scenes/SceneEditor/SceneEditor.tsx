import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {KnowledgeBaseDrawer} from "./parts/KnoledgeBaseDrawer";
import { OpenRouterApi } from "@/api/openRouterApi";
import { BlockInstanceRepository } from "@/repository/BlockInstance/BlockInstanceRepository";
import type { IBlockInstance } from "@/entities/BookEntities";
import { useBookDbConnection } from "@/components/hooks/useBookDbConnection";
import { generateUUID } from "@/utils/UUIDUtils";
import { notifications } from "@mantine/notifications"; // Already imported but good to confirm



import { useMedia } from "@/providers/MediaQueryProvider/MediaQueryProvider";
import { useSceneEditor } from "@/components/scenes/SceneEditor/hooks/useSceneEditor";
import type { SceneEditorProps } from "./types";
import {IWarningGroup} from "@/components/shared/RichEditor/types";
import {SceneMobileContent} from "@/components/scenes/SceneEditor/parts/SceneMobileContent";
import {SceneDesktopContent} from "@/components/scenes/SceneEditor/parts/SceneDesktopContent";
import {Box, LoadingOverlay} from "@mantine/core";
import {IBlock} from "@/entities/ConstructorEntities";
import {BlockRepository} from "@/repository/Block/BlockRepository";
import {bookDb} from "@/entities/bookDb";
import {useLiveQuery} from "dexie-react-hooks";

// Local type definitions (assuming they are not globally available or imported from openRouterApi.ts)
interface KnowledgeBaseEntity {
    title: string;
    description: string;
}



export const SceneEditor = ({ sceneId}: SceneEditorProps) => {
    const navigate = useNavigate();
    const { isMobile } = useMedia();

    const { scene, saveScene } = useSceneEditor(sceneId);

    const [selectedGroup, setSelectedGroup] = useState<IWarningGroup>();
    const [sceneBody, setSceneBody] = useState("");
    const [warningGroups, setWarningGroups] = useState<IWarningGroup[]>([]);
    const [focusMode, setFocusMode] = useState(false);

    // State for Knowledge Base Drawer
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedBlock, setSelectedBlock] = useState<IBlock | null>(null); // Store the whole object
    const [knowledgeBaseEntities, setKnowledgeBaseEntities] = useState<KnowledgeBaseEntity[]>([]);
    const [isGeneratingEntities, setIsGeneratingEntities] = useState(false);

    const toggleFocusMode = useCallback(() => setFocusMode((prev) => !prev), []);

    // Functions for Knowledge Base Drawer
    const openKnowledgeBaseDrawer = useCallback(() => setIsDrawerOpen(true), []);

    const blocks = useLiveQuery<IBlock[]>(() => BlockRepository.getAll(bookDb), [])

    const closeKnowledgeBaseDrawer = useCallback(() => {
        setIsDrawerOpen(false);
        setSelectedBlock(null); // Clear selected IBlock on drawer close
        setKnowledgeBaseEntities([]); // Clear entities on drawer close
    }, []);

    const handleSelectBlock = useCallback((uuid: string | null) => {
        const block = blocks?.find(ib => ib.uuid === uuid) || null;
        setSelectedBlock(block);
        setKnowledgeBaseEntities([]); // Clear entities when IBlock changes
    }, [blocks]);



    const handleGenerateKnowledgeBase = useCallback(async () => {
        if (!selectedBlock || !scene?.body) {
            notifications.show({
                title: "Ошибка",
                message: "Не выбран тип блока или отсутствует текст сцены.",
                color: "orange",
            });
            return;
        }
        setIsGeneratingEntities(true);
        setKnowledgeBaseEntities([]); // Clear previous entities

        try {
            const entities = await OpenRouterApi.fetchKnowledgeBaseEntities(
                scene.body, // Assuming scene.body contains the plain text or HTML content
                selectedBlock
            );
            setKnowledgeBaseEntities(entities);
            if (entities.length === 0) {
                notifications.show({
                    title: "Генерация завершена",
                    message: "Сущности не найдены.",
                    color: "blue",
                });
            }
        } catch (error) {
            // Error is already handled by notifications.show in the API, but you could add more here
            console.error("Failed to fetch knowledge base entities", error);
        } finally {
            setIsGeneratingEntities(false);
        }
    }, [selectedBlock, scene?.body]); // Added db to dependencies

    const handleAddEntity = useCallback(async (entity: KnowledgeBaseEntity) => {

        if (!selectedBlock) {
            notifications.show({ title: "Ошибка", message: "Не выбран тип блока (IBlock).", color: "red" });
            return;
        }

        try {
            const newInstance: IBlockInstance = {
                uuid: generateUUID(),
                blockUuid: selectedBlock?.uuid, // selectedIBlock.value is the UUID of the IBlock
                title: entity.title,
                shortDescription: entity.description,
                // parentInstanceUuid: null, // Explicitly set if needed, otherwise undefined
                // icon: null, // Explicitly set if needed
                // color: null, // Explicitly set if needed
            };
            await BlockInstanceRepository.create(bookDb, newInstance);
            notifications.show({
                title: "Успех",
                message: `Сущность "${entity.title}" добавлена.`,
                color: "green",
            });
            // Optionally remove from list or disable button
            setKnowledgeBaseEntities(prev => prev.filter(e => e.title !== entity.title || e.description !== entity.description));
        } catch (error: any) {
            console.error("Failed to add entity:", error);
            notifications.show({
                title: "Ошибка",
                message: `Не удалось добавить сущность "${entity.title}": ${error.message}`,
                color: "red",
            });
        }
    }, [selectedBlock]);

    const handleAddAllEntities = useCallback(async (entities: KnowledgeBaseEntity[]) => {

        if (!selectedBlock) {
            notifications.show({ title: "Ошибка", message: "Не выбран тип блока (IBlock).", color: "red" });
            return;
        }
        if (entities.length === 0) {
            notifications.show({ title: "Информация", message: "Нет сущностей для добавления.", color: "blue" });
            return;
        }

        let successCount = 0;
        for (const entity of entities) {
            try {
                const newInstance: IBlockInstance = {
                    uuid: generateUUID(),
                    blockUuid: selectedBlock.uuid,
                    title: entity.title,
                    shortDescription: entity.description,
                };
                await BlockInstanceRepository.create(bookDb, newInstance);
                successCount++;
            } catch (error: any) {
                console.error(`Failed to add entity "${entity.title}":`, error);
                notifications.show({
                    title: "Ошибка при добавлении",
                    message: `Не удалось добавить сущность "${entity.title}": ${error.message}`,
                    color: "red",
                });
                // Optional: decide if you want to stop on first error or try all
            }
        }

        if (successCount > 0) {
            notifications.show({
                title: "Успех",
                message: `${successCount} из ${entities.length} сущностей успешно добавлены.`,
                color: "green",
            });
        }
        if (successCount === entities.length) {
            setKnowledgeBaseEntities([]); // Clear list if all were added
        } else {
            // Refresh list to remove successfully added ones if partial success
            // This is a simple way; a more robust way would be to track IDs if available
            setKnowledgeBaseEntities(prev => prev.filter(e =>
                !entities.slice(0, successCount).find(se => se.title === e.title && se.description === e.description)
            ));
        }

    }, [selectedBlock]);

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
            const updatedScene = {
                ...scene,
                body: contentHTML,
                totalSymbolCountWithSpaces: contentText.length,
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
    }, [scene, scene?.body]);

    if (!scene?.id) return null;


    if (scene?.id !== sceneId) {
        return (
            <Box pos="relative" style={{minHeight: "100dvh"}}>
                <LoadingOverlay visible={true} overlayBlur={2} />;
            </Box>
        )
    }

    return (
        <>
            {scene?.id === sceneId && (<Box>
                {isMobile ? (
                    <SceneMobileContent
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
                        openKnowledgeBaseDrawer={openKnowledgeBaseDrawer} // Pass down the function
                    />
                ) : (
                    <SceneDesktopContent
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
                        openKnowledgeBaseDrawer={openKnowledgeBaseDrawer} // Pass down the function
                    />
                )}
                <KnowledgeBaseDrawer
                    isOpen={isDrawerOpen}
                    onClose={closeKnowledgeBaseDrawer}
                    blocks={blocks}
                    selectedBlockUuid={selectedBlock?.uuid || null} // Pass the value for Select component
                    onSelectBlock={handleSelectBlock}
                    onGenerate={handleGenerateKnowledgeBase}
                    knowledgeBaseEntities={knowledgeBaseEntities}
                    isGeneratingEntities={isGeneratingEntities}
                    onAddEntity={handleAddEntity} // Pass implemented function
                    onAddAllEntities={handleAddAllEntities} // Pass implemented function
                />
            </Box>)
            }
        </>
    );
};
