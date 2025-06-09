import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text, Button, Group, Title, Paper, ActionIcon, Modal, ScrollArea, Collapse, UnstyledButton, TextInput } from '@mantine/core'; // Added TextInput
import { IconLink, IconUnlink, IconArrowRight, IconChevronDown, IconChevronRight, IconSearch } from '@tabler/icons-react'; // Added IconSearch
import { useNavigate } from 'react-router-dom';
import { IBlockInstanceSceneLink, IScene, IChapter } from '@/entities/BookEntities';
import { bookDb } from '@/entities/bookDb';
import { generateUUID } from '@/utils/UUIDUtils';
import { useLiveQuery } from 'dexie-react-hooks';
import {SceneRepository} from "@/repository/Scene/SceneRepository";
import {ChapterRepository} from "@/repository/Scene/ChapterRepository";
import {useDialog} from "@/providers/DialogProvider/DialogProvider";

export interface IInstanceScenesEditorProps {
    blockInstanceUuid: string;
    blockUuid: string;
}

export interface ISceneTreeNode {
    id: string;
    title: string;
    scenes: IScene[];
    isChapter: boolean;
    chapterObj?: IChapter;
}

export const InstanceScenesEditor: React.FC<IInstanceScenesEditorProps> = ({ blockInstanceUuid, blockUuid }) => {
    const navigate = useNavigate();
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [expandedChapterIds, setExpandedChapterIds] = useState<Record<string, boolean>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const { showDialog } = useDialog();

    const toggleChapterExpansion = (nodeId: string) => {
        setExpandedChapterIds(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
    };

    const linkedSceneLinks = useLiveQuery(
        () => bookDb.blockInstanceSceneLinks.where({ blockInstanceUuid }).toArray(),
        [blockInstanceUuid],
        undefined
    );

    const allScenesCollection = useLiveQuery(
        () => SceneRepository.getAll(bookDb),
        [],
        undefined
    );

    const allChapters = useLiveQuery(
        () => ChapterRepository.getAll(bookDb),
        [],
        undefined
    );

    const [linkedScenesDetails, setLinkedScenesDetails] = useState<Array<{link: IBlockInstanceSceneLink, scene: IScene | undefined}>>([]);
    useEffect(() => {
        if (linkedSceneLinks && allScenesCollection) {
            const details = linkedSceneLinks.map(link => {
                const scene = allScenesCollection.find(s => s.id === link.sceneId);
                return { link, scene };
            });
            setLinkedScenesDetails(details);
        } else {
            setLinkedScenesDetails([]);
        }
    }, [linkedSceneLinks, allScenesCollection]);

    const [treeData, setTreeData] = useState<ISceneTreeNode[]>([]);
    useEffect(() => {
        if (allChapters && allScenesCollection && linkedSceneLinks) {
            const nodes: ISceneTreeNode[] = [];
            const scenesByChapterId: Record<string, IScene[]> = {};
            const linkedSceneIds = new Set(linkedSceneLinks.map(l => l.sceneId));

            allScenesCollection.forEach(scene => {
                if (scene.id && !linkedSceneIds.has(scene.id)) {
                    const chapterIdKey = scene.chapterId?.toString() || "0";
                    if (!scenesByChapterId[chapterIdKey]) {
                        scenesByChapterId[chapterIdKey] = [];
                    }
                    scenesByChapterId[chapterIdKey].push(scene);
                }
            });

            for (const chapterIdKey in scenesByChapterId) {
                scenesByChapterId[chapterIdKey].sort((a, b) => (a.order || 0) - (b.order || 0));
            }

            allChapters.forEach(chapter => {
                const chapterIdStr = chapter.id?.toString();
                if (chapterIdStr && scenesByChapterId[chapterIdStr] && scenesByChapterId[chapterIdStr].length > 0) {
                    nodes.push({
                        id: `chapter-${chapter.id}`,
                        title: chapter.title,
                        scenes: scenesByChapterId[chapterIdStr] || [],
                        isChapter: true,
                        chapterObj: chapter,
                    });
                }
            });

            if (scenesByChapterId["0"] && scenesByChapterId["0"].length > 0) {
                nodes.push({
                    id: 'chapter-uncategorized',
                    title: 'Сцены без главы',
                    scenes: scenesByChapterId["0"],
                    isChapter: false,
                });
            }
            setTreeData(nodes);
        } else {
            setTreeData([]);
        }
    }, [allChapters, allScenesCollection, linkedSceneLinks, linkModalOpen]);

    const filteredTreeData = useMemo(() => {
        if (!searchTerm.trim()) {
            return treeData;
        }
        const lowerSearchTerm = searchTerm.toLowerCase();
        return treeData.map(node => {
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
    }, [filteredTreeData, searchTerm]);


    const handleNavigateToScene = (sceneId: number | undefined) => {
        if (sceneId === undefined) return;
        navigate(`/scene/card?id=${sceneId}`);
    };

    const handleLinkScene = async (sceneId: number) => {
        if (!blockUuid) {
            console.error("blockUuid is missing, cannot link scene.");
            return;
        }
        const newLink: IBlockInstanceSceneLink = {
            uuid: generateUUID(),
            blockInstanceUuid,
            blockUuid,
            sceneId,
        };
        try {
            await bookDb.blockInstanceSceneLinks.add(newLink);
        } catch (error) {
            console.error("Failed to link scene:", error);
        }
    };

    const handleUnlinkScene = async (linkId: number | undefined) => {
        const confirm = await showDialog("Подтверждение", "Удалить привязку к сцене?");
        if (!confirm) return;
        if (linkId === undefined) {
            console.error("Link ID is undefined, cannot unlink scene.");
            return;
        }
        try {
            await bookDb.blockInstanceSceneLinks.delete(linkId);
        } catch (error) {
            console.error("Failed to unlink scene:", error);
        }
    };

    const handleLinkNewScene = () => {
        setModalLoading(true);
        setLinkModalOpen(true);
    };

    useEffect(() => {
        if (linkModalOpen) {
            if (allChapters && allScenesCollection && linkedSceneLinks) {
                setModalLoading(false);
            } else {
                setModalLoading(true);
            }
        }
    }, [linkModalOpen, allChapters, allScenesCollection, linkedSceneLinks]);


    if (linkedSceneLinks === undefined || allScenesCollection === undefined || allChapters === undefined) {
        return <Text>Загрузка данных...</Text>;
    }

    if (!blockInstanceUuid) {
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
                    <Paper shadow="xs" p="sm" mb="sm" key={link.uuid}>
                        <Group justify="space-between">
                            <Text>{scene?.title || `Сцена ID: ${link.sceneId}`}</Text>
                            <Group>
                                <ActionIcon
                                    variant="subtle"
                                    onClick={() => handleNavigateToScene(link.sceneId)}
                                    title="Перейти к сцене"
                                >
                                    <IconArrowRight size={16} />
                                </ActionIcon>
                                <ActionIcon
                                    variant="subtle"
                                    color="red"
                                    onClick={() => handleUnlinkScene(link.id)}
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
                {modalLoading ? <Text>Загрузка доступных сцен...</Text> :
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
