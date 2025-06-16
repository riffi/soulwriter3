import {
  Drawer,
  Button,
  Group,
  List,
  Text,
  Modal,
  Box,
  ActionIcon,
  ScrollArea,
  Title,
  Divider,
  TextInput,
  Stack
} from "@mantine/core";
import { InlineEdit2 } from "@/components/shared/InlineEdit2/InlineEdit2";
import { useDisclosure } from "@mantine/hooks";
import { bookDb } from "@/entities/bookDb";
import React, { useEffect, useState } from "react";
import {IBlockInstance, IBlockInstanceSceneLink} from "@/entities/BookEntities";
import {IBlock, IBlockStructureKind} from "@/entities/ConstructorEntities";
import {IconMan, IconTrash} from "@tabler/icons-react";
import {useLiveQuery} from "dexie-react-hooks";

interface SceneLinkManagerProps {
  sceneId: number;
  opened: boolean;
  onClose: () => void;
}

export const SceneLinkManager = ({ sceneId, opened, onClose }: SceneLinkManagerProps) => {
  const [selectedBlock, setSelectedBlock] = useState<IBlock | null>(null);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [newLinkTitle, setNewLinkTitle] = useState('');


  const blocks = useLiveQuery<IBlock[]>(async () => {
    return bookDb.blocks.where('sceneLinkAllowed').equals(1).toArray();
  }, [sceneId])

  const links = useLiveQuery<IBlockInstanceSceneLink[]>(async () => {
    return bookDb.blockInstanceSceneLinks.where('sceneId').equals(sceneId).toArray();
  }, [sceneId])

  const blockInstances = useLiveQuery<IBlockInstance[]>(async () => {
    return bookDb.blockInstances.toArray();
  }, [sceneId])

  if (!blocks || !links || !blockInstances) {
    return null;
  }
  //
  //
  // useEffect(() => {
  //   const loadData = async () => {
  //     const [allowedBlocks, existingLinks, instances] = await Promise.all([
  //       bookDb.blocks.where('sceneLinkAllowed').equals(1).toArray(),
  //       bookDb.blockInstanceSceneLinks.where('sceneId').equals(sceneId).toArray(),
  //       bookDb.blockInstances.toArray()
  //     ]);
  //
  //     setBlocks(allowedBlocks);
  //     setLinks(existingLinks);
  //     setBlockInstances(instances);
  //   };
  //   loadData();
  // }, [sceneId]);

  const handleCreateLink = async (blockInstanceUuid: string) => {
    const newLink: IBlockInstanceSceneLink = {
      blockInstanceUuid,
      sceneId,
      blockUuid: selectedBlock?.uuid!,
      title: newLinkTitle,
    };

    await bookDb.blockInstanceSceneLinks.add(newLink);
    setNewLinkTitle(''); // Reset title input
    closeModal();
  };

  const handleDeleteLink = async (linkId: number) => {
    await bookDb.blockInstanceSceneLinks.delete(linkId);
  };

  const handleUpdateLinkTitle = async (linkId: number, newTitle: string) => {
    try {
      await bookDb.blockInstanceSceneLinks.update(linkId, { title: newTitle });
    } catch (error) {
      console.error("Failed to update link title:", error);
    }
  };

  const getLinkedInstances = (blockUuid: string) => {
    return blockInstances.filter(instance =>
        links.some(link =>
            link.blockInstanceUuid === instance.uuid &&
            instance.blockUuid === blockUuid
        )
    );
  };

  const currentBlockInstances = blockInstances.filter(
      instance => instance.blockUuid === selectedBlock?.uuid);

  const availableInstances = currentBlockInstances.filter(
      instance => !links.some(l => l.blockInstanceUuid === instance.uuid)
  );

  return (
      <Drawer
          opened={opened}
          onClose={onClose}
          position="right"
          size="xl"
          title={
            <Title order={3} mb="sm" pb="md" style={{
              width: '100%'
            }}>
              Связи сцены
            </Title>
          }
      >
        <ScrollArea h={`calc(100vh - 120px)`}>
          <List spacing="md">
            <>
              {blocks?.map(block => {
                const linkedInstances = getLinkedInstances(block.uuid!);
                const blockTitle = block.structureKind === IBlockStructureKind.multiple
                    ? block.titleForms?.plural
                    : block.title;

                return (
                    <Box key={block.uuid} mb="xl">
                      <Group justify="space-between" mb="sm">
                        <Title order={5} c="dimmed" style={{
                          textTransform: 'capitalize',
                          paddingBottom: 4
                        }}>
                          {blockTitle}
                        </Title>
                        <Button
                            size="xs"
                            onClick={() => {
                              setSelectedBlock(block);
                              openModal();
                            }}
                        >
                          + Добавить
                        </Button>
                      </Group>
                      <>
                        {linkedInstances.length > 0 ? (
                            <Box

                                listStyleType={'none'}
                            >
                              <>
                                {linkedInstances.map(instance => {
                                  const link = links.find(l => l.blockInstanceUuid === instance.uuid);
                                  return (
                                      <>
                                        <Box
                                            key={instance.uuid}
                                            style={{margin: '0', width:"100%"}}
                                        >
                                          <Group justify="space-between" w="100%">
                                            <div style={{flex: 1}}>
                                              <Text fw={500}>{instance.title}</Text>
                                                {link?.title &&
                                                    <Box style={{width: '100%'}}>
                                                    <InlineEdit2
                                                        value={link.title}
                                                        onChange={(newTitle) => handleUpdateLinkTitle(link.id!, newTitle)}
                                                        size={"xs"}

                                                    />
                                                    </Box>
                                                }
                                              </div>
                                              <ActionIcon
                                                  color="red"
                                                  variant="subtle"
                                                  onClick={() => link?.id && handleDeleteLink(link.id)}
                                              >
                                                <IconTrash size={16}/>
                                              </ActionIcon>
                                          </Group>
                                        </Box>
                                      </>
                                  );
                                })}
                              </>
                            </Box>
                        ) : (
                            <Text c="dimmed" size="sm" ml="md">
                              Нет привязанных элементов
                            </Text>
                        )}
                      </>
                    </Box>
                );
              })}
            </>
          </List>
        </ScrollArea>

        <Modal
            opened={modalOpened}
            onClose={() => {
              closeModal();
              setNewLinkTitle(''); // Reset title on modal close
            }}
            title={
              <Title order={4}>
                Выберите {selectedBlock?.titleForms?.accusative}
              </Title>
            }
            size="lg"
        >
          <TextInput
              label="Название связи (опционально)"
              placeholder="Введите название для этой связи..."
              value={newLinkTitle}
              onChange={(event) => setNewLinkTitle(event.currentTarget.value)}
              mb="md"
          />
          {availableInstances.length > 0 ? (
              <ScrollArea h={350}> {/* Adjusted height to accommodate TextInput */}
                <List spacing="xs" listStyleType={'none'}>
                  {availableInstances.map(i => (
                      <List.Item key={i.uuid}>
                        <Button
                            variant="light"
                            fullWidth
                            onClick={() => handleCreateLink(i.uuid)}
                            styles={{
                              inner: { justifyContent: 'start' }
                            }}
                        >
                          {i.title}
                        </Button>
                      </List.Item>
                  ))}
                </List>
              </ScrollArea>
          ) : (
              <Text c="dimmed" ta="center" py="md">
                Все элементы уже привязаны
              </Text>
          )}
        </Modal>
      </Drawer>
  );
};
