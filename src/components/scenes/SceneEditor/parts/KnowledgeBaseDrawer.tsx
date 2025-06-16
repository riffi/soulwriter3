import { Drawer, Select, Button, Space, LoadingOverlay, Text, Card, Group, ActionIcon, ScrollArea, Divider, Checkbox } from '@mantine/core';
import { IconPlus, IconLink } from '@tabler/icons-react';
import { IBlock } from "@/entities/ConstructorEntities"; // Ensure IBlock is imported
import { useState, useCallback, useEffect } from 'react'; // Add useEffect if needed for any side effects
import { notifications } from '@mantine/notifications';
import { generateUUID } from '@/utils/UUIDUtils';
import { BlockInstanceRepository } from '@/repository/BlockInstance/BlockInstanceRepository';
import { bookDb } from '@/entities/bookDb'; // To query blockInstances and blockInstanceSceneLinks
import { OpenRouterApi } from '@/api/openRouterApi'; // For fetching knowledge base entities
import type { IBlockInstance, IBlockInstanceSceneLink } from "@/entities/BookEntities";
import {useLiveQuery} from "dexie-react-hooks";
import {KnowledgeBaseEntity, KnowledgeBaseEntityDisplay} from "@/entities/KnowledgeBaseEntities";
import {IconViewer} from "@/components/shared/IconViewer/IconViewer"; // For types

interface KnowledgeBaseDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    blocks: IBlock[]; // Keep blocks from props
    sceneId: number; // Add sceneId
    sceneBody: string | null | undefined; // Add this
}

export const KnowledgeBaseDrawer = ({
                                        isOpen,
                                        onClose,
                                        blocks, // blocks is now a direct prop
                                        sceneId, // sceneId is now a direct prop
                                        sceneBody, // Add this
                                    }: KnowledgeBaseDrawerProps) => {
    const [selectedBlock, setSelectedBlock] = useState<IBlock | null>(null);
    const [apiEntities, setApiEntities] = useState<KnowledgeBaseEntity[]>([]);
    const [isGeneratingEntities, setIsGeneratingEntities] = useState(false);
    const [entitySelection, setEntitySelection] = useState<Record<string, string | null>>({});

    const existingInstances = useLiveQuery(() => {
        if (!selectedBlock){
            return []
        }
        return bookDb.blockInstances
            .where('blockUuid')
            .equals(selectedBlock?.uuid)
            .toArray()
            .then(arr => arr.sort((a, b) => a.title.localeCompare(b.title)));
    }, [selectedBlock]);

    const sceneLinks = useLiveQuery(() => {
        if (!selectedBlock){
            return []
        }
        return bookDb.blockInstanceSceneLinks
            .where('sceneId')
            .equals(sceneId)
            .and(link => link.blockUuid === selectedBlock.uuid)
            .toArray()
    }, [selectedBlock]);


    const knowledgeBaseEntities: KnowledgeBaseEntityDisplay[] = apiEntities.map(entity => {
        const selectedUuid = entitySelection[entity.title] ?? null;
        const existingInstance = selectedUuid
            ? existingInstances?.find(inst => inst.uuid === selectedUuid)
            : existingInstances?.find(inst => inst.title === entity.title);

        let isLinked = false;
        if (existingInstance) {
            isLinked = sceneLinks?.some(link => link.blockInstanceUuid === existingInstance.uuid);
        }
        return {
            ...entity,
            isExisting: !!existingInstance,
            isLinked,
            instanceUuid: existingInstance?.uuid,
            instance: existingInstance,
        };
    });


    const handleSelectBlock = useCallback((uuid: string | null) => {
        const block = blocks?.find(ib => ib.uuid === uuid) || null;
        setSelectedBlock(block);
    }, [blocks]);

    const handleGenerateKnowledgeBase = useCallback(async () => {
        if (!selectedBlock || !sceneId) {
            notifications.show({
                title: "Ошибка",
                message: "Не выбран тип блока или отсутствует ID сцены.",
                color: "orange",
            });
            return;
        }

        if (!sceneBody) { // Check if sceneBody is available
            notifications.show({
                title: "Ошибка",
                message: "Отсутствует текст сцены для анализа.",
                color: "orange",
            });
            return;
        }

        setIsGeneratingEntities(true);

        try {
            const apiEntitiesList = await OpenRouterApi.fetchKnowledgeBaseEntities(sceneBody, selectedBlock); // Use sceneBody prop

            if (apiEntitiesList.length === 0) {
                notifications.show({
                    title: "Генерация завершена",
                    message: "Сущности не найдены.",
                    color: "blue",
                });
                setIsGeneratingEntities(false);
                return;
            }
            setApiEntities(apiEntitiesList)

        } catch (error) {
            console.error("Failed to fetch knowledge base entities", error);
            notifications.show({
                title: "Ошибка генерации",
                message: "Не удалось получить сущности из базы знаний.", // More generic error
                color: "red",
            });
        } finally {
            setIsGeneratingEntities(false);
        }
    }, [selectedBlock, sceneId, sceneBody]); // Add sceneBody to dependencies

    const handleBindEntityToScene = async (entity: KnowledgeBaseEntityDisplay) => {
        const instanceUuid = entitySelection[entity.title] ?? entity.instanceUuid;
        const existingLink = await bookDb.blockInstanceSceneLinks
            .where('blockInstanceUuid').equals(instanceUuid)
            .and(link => link.sceneId === sceneId)
            .first();

        if (!existingLink) {
            if (entity.isLinked && entity.instanceUuid) {
                await bookDb.blockInstanceSceneLinks
                    .where('sceneId')
                    .equals(sceneId)
                    .and(link => link.blockInstanceUuid === entity.instanceUuid)
                    .delete();
            }
            const newLink: IBlockInstanceSceneLink = {
                uuid: generateUUID(),
                blockInstanceUuid: instanceUuid,
                blockUuid: selectedBlock.uuid,
                sceneId: sceneId,
                title: entity.sceneDescription,
            };
            await bookDb.blockInstanceSceneLinks.add(newLink);
            notifications.show({
                title: "Связь добавлена",
                message: `Сущность "${entity.title}" привязана к сцене.`,
                color: "blue",
            });
        } else if (entity.isExisting) {
            notifications.show({
                title: "Информация",
                message: `Сущность "${entity.title}" уже была привязана к сцене.`,
                color: "cyan",
            });
        }
    }
    const handleAddEntity = useCallback(async (entity: KnowledgeBaseEntityDisplay) => {
        if (!selectedBlock) {
            notifications.show({ title: "Ошибка", message: "Не выбран тип блока (IBlock).", color: "red" });
            return;
        }

        try {
            const selectedUuid = entitySelection[entity.title];

            if (selectedUuid) {
                const existing = await bookDb.blockInstances.where('uuid').equals(selectedUuid).first();
                if (!existing) {
                    notifications.show({ title: "Ошибка", message: "Выбранный экземпляр не найден.", color: "orange" });
                    return;
                }
            } else if (!entity.isExisting) {
                const newInstance: IBlockInstance = {
                    uuid: generateUUID(),
                    blockUuid: selectedBlock.uuid,
                    title: entity.title,
                    shortDescription: entity.description,
                };
                await BlockInstanceRepository.create(bookDb, newInstance);
                notifications.show({
                    title: "Успех",
                    message: `Сущность "${entity.title}" добавлена.`,
                    color: "green",
                });
                setEntitySelection(prev => ({ ...prev, [entity.title]: newInstance.uuid }));
            }

        } catch (error: any) {
            console.error("Failed to add or link entity:", error);
            notifications.show({
                title: "Ошибка",
                message: `Не удалось добавить или связать сущность "${entity.title}": ${error.message}`,
                color: "red",
            });
        }
    }, [selectedBlock, sceneId, knowledgeBaseEntities, handleGenerateKnowledgeBase, entitySelection]);

    return (
        <Drawer
            opened={isOpen}
            onClose={onClose}
            title="Наполнить базу знаний"
            padding="md"
            size="lg" // Increased size for better content display
            position="right"
        >
            <div style={{ position: 'relative', minHeight: '200px' }}> {/* For LoadingOverlay context */}
                <LoadingOverlay visible={isGeneratingEntities && knowledgeBaseEntities.length === 0} overlayProps={{ blur: 2 }} />

                <Select
                    label="Выберите элемент"
                    placeholder="Выберите элемент"
                    data={blocks?.map(b => ({ value: b.uuid, label: b.title }))}
                    value={selectedBlock?.uuid || null}
                    onChange={handleSelectBlock}
                    clearable
                    disabled={isGeneratingEntities}
                />
                <Space h="md" />
                <Button
                    onClick={handleGenerateKnowledgeBase}
                    disabled={!selectedBlock || isGeneratingEntities}
                    loading={isGeneratingEntities}
                >
                    Сгенерировать
                </Button>
                <Space h="md" />

                <ScrollArea style={{ height: 'calc(100vh - 350px)' }}> {/* Adjusted height */}
                    {knowledgeBaseEntities.length === 0 && !isGeneratingEntities && (
                        <Text c="dimmed" ta="center">Сущности не найдены или еще не сгенерированы.</Text>
                    )}

                    {knowledgeBaseEntities.map((entity, index) => (
                        <Card key={index} shadow="sm" padding="sm" radius="md" withBorder mb="sm"
                              style={entity.isExisting ? { backgroundColor: 'var(--mantine-color-gray-1)' } : {}} >
                            <Group justify="space-between">
                                {entity.instance &&
                                    <IconViewer
                                        size={24}
                                        icon={entity.instance.icon ?? selectedBlock?.icon}
                                        color={'gray'}
                                    />
                                }
                                <div style={{ flex: 1 }}>
                                    <Text fw={500}>{entity.instance ? entity.instance.title : entity.title}</Text>
                                    <Text size="sm" c="dimmed">
                                        <b>Общее описание: </b>{entity.description}
                                    </Text>
                                    <Text size="sm" c="dimmed">
                                        <b>Роль в сцене: </b>{entity.sceneDescription}
                                    </Text>
                                    {entity.isExisting && (
                                        <Text size="xs" c="teal"> (Уже есть в Базе)</Text>
                                    )}
                                    {existingInstances && existingInstances.length > 0 && (
                                        <Select
                                            size="xs"
                                            mt={4}
                                            data={existingInstances.map(i => ({ value: i.uuid!, label: i.title }))}
                                            value={entitySelection[entity.title] ?? entity.instanceUuid ?? null}
                                            onChange={(val) => setEntitySelection(prev => ({ ...prev, [entity.title]: val }))}
                                            placeholder={'Выбрать ' + selectedBlock?.titleForms?.genitive}
                                            clearable
                                            searchable
                                        />
                                    )}
                                </div>

                                {entity.isExisting ? (
                                    selectedBlock && selectedBlock.sceneLinkAllowed === 1 ? (
                                        entity.isLinked ? (
                                            <Text size="sm" c="blue">Уже привязано</Text>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="xs"
                                                onClick={() => handleBindEntityToScene(entity)} // handleAddEntity should handle linking existing
                                                disabled={isGeneratingEntities} // Disable if main checkbox "linkToScene" is false
                                                title="Привязать к сцене"
                                                leftSection={<IconLink size={14} />}
                                            >
                                                Привязать
                                            </Button>
                                        )
                                    ) : (
                                        // Existing but block does not allow scene linking - show nothing or different message
                                        <Text size="sm" c="dimmed">Нельзя привязать</Text>
                                    )
                                ) : (
                                    // Not existing - show regular add button
                                    <ActionIcon
                                        variant="outline"
                                        onClick={() => handleAddEntity(entity)}
                                        disabled={isGeneratingEntities}
                                        aria-label={`Add ${entity.title}`}
                                        title={`Добавить ${entity.title}`}
                                    >
                                        <IconPlus size={16} />
                                    </ActionIcon>
                                )}
                            </Group>
                        </Card>
                    ))}
                </ScrollArea>
            </div>
        </Drawer>
    );
};


