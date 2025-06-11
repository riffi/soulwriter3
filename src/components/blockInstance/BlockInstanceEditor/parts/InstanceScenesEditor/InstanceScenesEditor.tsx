import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text, Button, Group, Title, Paper, ActionIcon, Modal, ScrollArea, Collapse, UnstyledButton, TextInput } from '@mantine/core';
import { IconLink, IconUnlink, IconArrowRight, IconChevronDown, IconChevronRight, IconSearch } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
// IBlockInstanceSceneLink, IScene, IChapter are now primarily used within the hooks or as return types from them
// import { IBlockInstanceSceneLink, IScene, IChapter } from '@/entities/BookEntities';
// import { bookDb } from '@/entities/bookDb'; // Moved to hooks
// import { generateUUID } from '@/utils/UUIDUtils'; // Moved to hooks
// import { useLiveQuery } from 'dexie-react-hooks'; // Moved to hooks
// import {SceneRepository} from "@/repository/Scene/SceneRepository"; // Moved to hooks
// import {ChapterRepository} from "@/repository/Scene/ChapterRepository"; // Moved to hooks
// import {useDialog} from "@/providers/DialogProvider/DialogProvider"; // Moved to hooks

import { useInstanceScenesData, ISceneTreeNode, ILinkedSceneDetail } from '../hooks/useInstanceScenesData'; // Import data hook
import { useInstanceScenesMutations } from '../hooks/useInstanceScenesMutations'; // Import mutations hook

export interface IInstanceScenesEditorProps {
    blockInstanceUuid: string;
    blockUuid: string | undefined; // Made undefined consistent with hook usage
}

// ISceneTreeNode is now imported from useInstanceScenesData

export const InstanceScenesEditor: React.FC<IInstanceScenesEditorProps> = ({ blockInstanceUuid, blockUuid }) => {
    const navigate = useNavigate();
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    // const [modalLoading, setModalLoading] = useState(false); // isLoading now comes from data hook
    const [expandedChapterIds, setExpandedChapterIds] = useState<Record<string, boolean>>({});
    const [searchTerm, setSearchTerm] = useState('');
    // const { showDialog } = useDialog(); // Moved to mutations hook

    const {
        linkedScenesDetails, // Comes from useInstanceScenesData
        availableScenesTree, // Comes from useInstanceScenesData (renamed from treeData)
        isLoading,           // Comes from useInstanceScenesData
    } = useInstanceScenesData(blockInstanceUuid);

    const { linkSceneToInstance, unlinkSceneFromInstance } = useInstanceScenesMutations();

    const toggleChapterExpansion = (nodeId: string) => {
        setExpandedChapterIds(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
    };

    // useEffects for linkedScenesDetails and treeData are removed as this logic is now in useInstanceScenesData

    const filteredTreeData = useMemo(() => {
        if (!searchTerm.trim()) {
            return availableScenesTree; // Use data from hook
        }
        const lowerSearchTerm = searchTerm.toLowerCase();
        return availableScenesTree.map(node => {
            const chapterTitleMatches = node.title.toLowerCase().includes(lowerSearchTerm);
            const matchingScenes = node.scenes.filter(scene =>
                scene.title.toLowerCase().includes(lowerSearchTerm)
            );
            if (chapterTitleMatches || matchingScenes.length > 0) {
                return {
                    ...node,
                    scenes: chapterTitleMatches ? node.scenes : matchingScenes,
                };
            }
            return null;
        }).filter(Boolean) as ISceneTreeNode[];
    }, [treeData, searchTerm]);

    useEffect(() => {
        if (searchTerm.trim()) {
            const newExpanded: Record<string, boolean> = {};
            filteredTreeData.forEach(node => {
                newExpanded[node.id] = true;
            });
            setExpandedChapterIds(newExpanded);
        }
        // No specific action on search term clear to retain user's manual expansions.
    }, [filteredTreeData, searchTerm]); // filteredTreeData itself depends on availableScenesTree

    const handleNavigateToScene = (sceneId: number | undefined) => {
        if (sceneId === undefined) return;
        navigate(`/scene/card?id=${sceneId}`);
    };

    const handleLinkScene = async (sceneId: number) => {
        // blockUuid is passed to the component and should be available
        await linkSceneToInstance(blockInstanceUuid, blockUuid, sceneId);
        // Potentially close modal or give feedback. Data will refresh via useLiveQuery in the hook.
    };

    const handleUnlinkScene = async (link: ILinkedSceneDetail) => {
        // unlinkSceneFromInstance from the hook now handles the dialog
        await unlinkSceneFromInstance(link.link.id);
        // Data will refresh via useLiveQuery in the hook.
    };

    const handleLinkNewScene = () => {
        // setModalLoading(true); // isLoading from data hook can be used in modal if needed
        setLinkModalOpen(true);
    };

    // useEffect for modalLoading is removed as isLoading from data hook can manage this.
    // The modal can show its own loading state based on whether availableScenesTree is populated.

    if (isLoading) { // Use isLoading from data hook
        return <Text>Загрузка данных...</Text>;
    }

    if (!blockInstanceUuid) { // This check might be redundant if isLoading handles initial undefined blockInstanceUuid state
        return <Text>Экземпляр блока не найден.</Text>;
    }

    return (
        <Box p="md">
            <Group justify="space-between" mb="md">
                <Title order={4}>Связанные сцены</Title>
                <Button leftSection={<IconLink size={14} />} onClick={handleLinkNewScene}>
                    Привязать новую сцену
                </Button>
            </Group>

            {linkedScenesDetails.length === 0 && (
                <Text>Нет привязанных сцен.</Text>
            )}

            <Box>
                {linkedScenesDetails.map(({ link, scene }) => (
                    <Paper shadow="xs" p="sm" mb="sm" key={item.link.uuid}> {/* Use item.link.uuid */}
                        <Group justify="space-between">
                            <Text>{item.scene?.title || `Сцена ID: ${item.link.sceneId}`}</Text>
                            <Group>
                                <ActionIcon
                                    variant="subtle"
                                    onClick={() => handleNavigateToScene(item.link.sceneId)}
                                    title="Перейти к сцене"
                                >
                                    <IconArrowRight size={16} />
                                </ActionIcon>
                                <ActionIcon
                                    variant="subtle"
                                    color="red"
                                    onClick={() => handleUnlinkScene(item)} // Pass the whole item or just item.link.id
                                    title="Отвязать сцену"
                                >
                                    <IconUnlink size={16} />
                                </ActionIcon>
                            </Group>
                        </Group>
                    </Paper>
                ))}
            </Box>

            <Modal opened={linkModalOpen} onClose={() => setLinkModalOpen(false)} title="Привязать новую сцену" size="lg">
                <TextInput
                    placeholder="Поиск по названию сцены или главы..."
                    leftSection={<IconSearch size={16} />}
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.currentTarget.value)}
                    mb="md"
                />
                {isLoading ? <Text>Загрузка доступных сцен...</Text> : // Use isLoading from data hook
                    <ScrollArea style={{ height: 400 }}> {/* Adjusted height */}
                        {filteredTreeData.map(node => (
                            <Box key={node.id} mb="sm">
                                <UnstyledButton
                                    onClick={() => toggleChapterExpansion(node.id)}
                                    style={{ width: '100%' }}
                                >
                                    <Group wrap="nowrap">
                                        <ActionIcon variant="transparent" size="sm">
                                            {expandedChapterIds[node.id] ? <IconChevronDown /> : <IconChevronRight />}
                                        </ActionIcon>
                                        <Text fw={500}>{node.title}</Text>
                                    </Group>
                                </UnstyledButton>

                                <Collapse in={expandedChapterIds[node.id] || false}>
                                    <Box ml="md" mt="xs">
                                        {node.scenes.length > 0 ? node.scenes.map(scene => (
                                            <Paper
                                                key={scene.id}
                                                p="xs"
                                                mb="xs"
                                                withBorder
                                                onClick={() => scene.id && handleLinkScene(scene.id)}
                                                style={{ cursor: 'pointer'}}
                                                sx={(theme) => ({
                                                    '&:hover': {
                                                        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[0],
                                                    },
                                                })}
                                            >
                                                <Text>{scene.title}</Text>
                                            </Paper>
                                        )) : (
                                            <Text size="sm" c="dimmed" ml="lg">
                                                {searchTerm.trim() ? 'Нет совпадений в этой главе' : 'Нет доступных сцен в этой главе.'}
                                            </Text>
                                        )}
                                    </Box>
                                </Collapse>
                            </Box>
                        ))}
                        {filteredTreeData.length === 0 && !modalLoading && (
                            <Text>
                                {searchTerm.trim() ? 'Ничего не найдено по вашему запросу.' : 'Нет доступных сцен для привязки.'}
                            </Text>
                        )}
                    </ScrollArea>
                }
            </Modal>
        </Box>
    );
};
