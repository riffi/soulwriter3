import { Drawer, Select, Button, Space, LoadingOverlay, Text, Card, Group, ActionIcon, ScrollArea, Divider } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import {IBlock} from "@/entities/ConstructorEntities";

// Assuming these types are passed or defined if not imported from API file
interface KnowledgeBaseEntity {
    title: string;
    description: string;
}


interface KnowledgeBaseDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    blocks: IBlock[];
    selectedBlockUuid: string | null;
    onSelectBlock: (value: string | null) => void;
    onGenerate: () => void;
    knowledgeBaseEntities: KnowledgeBaseEntity[];
    isGeneratingEntities: boolean;
    onAddEntity: (entity: KnowledgeBaseEntity) => void; // Placeholder
    onAddAllEntities: (entities: KnowledgeBaseEntity[]) => void; // Placeholder
}

export const KnowledgeBaseDrawer = ({
                                                                     isOpen,
                                                                     onClose,
                                                                     blocks,
                                                                     selectedBlockUuid,
                                                                     onSelectBlock,
                                                                     onGenerate,
                                                                     knowledgeBaseEntities,
                                                                     isGeneratingEntities,
                                                                     onAddEntity,
                                                                     onAddAllEntities,
                                                                 }) => {
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
                    data={blocks?.map(b=>{
                        return {
                            value: b.uuid,
                            label: b.title
                        }
                    })}
                    value={selectedBlockUuid}
                    onChange={onSelectBlock}
                    clearable
                    disabled={isGeneratingEntities}
                />
                <Space h="md" />
                <Button
                    onClick={onGenerate}
                    disabled={!selectedBlockUuid || isGeneratingEntities}
                    loading={isGeneratingEntities}
                >
                    Сгенерировать
                </Button>
                <Space h="xl" />

                {knowledgeBaseEntities.length > 0 && (
                    <>
                        <Divider my="md" label="Найденные сущности" labelPosition="center" />
                        <Button
                            variant="outline"
                            size="xs"
                            onClick={() => onAddAllEntities(knowledgeBaseEntities)}
                            disabled={isGeneratingEntities}
                            style={{ marginBottom: '1rem' }}
                        >
                            Добавить всех ({knowledgeBaseEntities.length})
                        </Button>
                    </>
                )}

                <ScrollArea style={{ height: 'calc(100vh - 300px)' }}> {/* Adjust height as needed */}
                    {knowledgeBaseEntities.length === 0 && !isGeneratingEntities && (
                        <Text c="dimmed" ta="center">Сущности не найдены или еще не сгенерированы.</Text>
                    )}

                    {knowledgeBaseEntities.map((entity, index) => (
                        <Card key={index} shadow="sm" padding="sm" radius="md" withBorder mb="sm">
                            <Group justify="space-between">
                                <div style={{ flex: 1 }}>
                                    <Text fw={500}>{entity.title}</Text>
                                    <Text size="sm" c="dimmed">{entity.description}</Text>
                                </div>
                                <ActionIcon
                                    variant="outline"
                                    onClick={() => onAddEntity(entity)}
                                    disabled={isGeneratingEntities}
                                    aria-label={`Add ${entity.title}`}
                                >
                                    <IconPlus size={16} />
                                </ActionIcon>
                            </Group>
                        </Card>
                    ))}
                </ScrollArea>
            </div>
        </Drawer>
    );
};


