import {Drawer, Button, Group, List, Text, Modal, Box, ActionIcon} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { bookDb } from "@/entities/bookDb";
import { useEffect, useState } from "react";
import {IBlockInstance, IBlockInstanceSceneLink} from "@/entities/BookEntities";
import {IBlock, IBlockStructureKind} from "@/entities/ConstructorEntities";
import {IconTrash} from "@tabler/icons-react";

interface SceneLinkManagerProps {
  sceneId: number;
  opened: boolean;
  onClose: () => void;
}

export const SceneLinkManager = ({ sceneId, opened, onClose }: SceneLinkManagerProps) => {
  const [blocks, setBlocks] = useState<IBlock[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<IBlock | null>(null);
  const [links, setLinks] = useState<IBlockInstanceSceneLink[]>([]);
  const [blockInstances, setBlockInstances] = useState<IBlockInstance[]>([]);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  useEffect(() => {
    const loadData = async () => {
      const [allowedBlocks, existingLinks, instances] = await Promise.all([
        bookDb.blocks.where('sceneLinkAllowed').equals(1).toArray(),
        bookDb.blockInstanceSceneLinks.where('sceneId').equals(sceneId).toArray(),
        bookDb.blockInstances.toArray()
      ]);

      setBlocks(allowedBlocks);
      setLinks(existingLinks);
      setBlockInstances(instances);
    };
    loadData();
  }, [sceneId]);

  const handleCreateLink = async (blockInstanceUuid: string) => {
      const newLink: IBlockInstanceSceneLink = {
        blockInstanceUuid,
        sceneId,
      };

      await bookDb.blockInstanceSceneLinks.add(newLink);
      setLinks([...links, newLink]);
      closeModal();
  };

  const handleDeleteLink = async (linkId: number) => {
    await bookDb.blockInstanceSceneLinks.delete(linkId);
    setLinks(links.filter(l => l.id !== linkId));
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


  return (
      <Drawer
          title="Связи сцены"
          opened={opened}
          onClose={onClose}
          position="right"
          size="xl"
      >
        <List spacing="sm">
          <>
          {blocks?.map(block => {
            const linkedInstances = getLinkedInstances(block.uuid!);

            return (
                <Box key={block.uuid}>
                  <Group justify="space-between" mb="md">
                    <Text
                        fw={500}
                        style={{textTransform: 'capitalize'}}
                    >
                      {block.structureKind === IBlockStructureKind.multiple ? block.titleForms?.plural : block.title}
                    </Text>
                    <Button
                        onClick={() => {
                          setSelectedBlock(block);
                          openModal();
                        }}
                    >
                      + Добавить
                    </Button>
                  </Group>
                  <Box style={{ marginLeft: '10px' }}>
                  {linkedInstances.map(instance => {
                    const link = links.find(l => l.blockInstanceUuid === instance.uuid);

                    return (
                        <Group key={instance.uuid} justify="space-between">
                          <Text>{instance.title}</Text>
                          <ActionIcon
                              color="red"
                              variant="subtle"
                              onClick={() => link?.id && handleDeleteLink(link.id)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                    );
                  })}
                  </Box>
                </Box>
            );
          })}
          </>
        </List>
        <Modal opened={modalOpened} onClose={closeModal} title={`Выберите ${selectedBlock?.titleForms?.accusative}`}>
          <List>
            <>
            {currentBlockInstances.map(i => (
                <List.Item key={i.uuid}>
                  <Button
                      variant="subtle"
                      fullWidth
                      onClick={() => handleCreateLink(i.uuid)}
                  >
                    {i.title}
                  </Button>
                </List.Item>
            ))}
            </>
          </List>
        </Modal>
      </Drawer>
  );
};
