import {
  Drawer,
  Button,
  Group,
  List,
  Text,
  Box,
  ActionIcon,
  ScrollArea,
  Title,
} from "@mantine/core";
import { InlineEdit2 } from "@/components/shared/InlineEdit2/InlineEdit2";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { IconTrash } from "@tabler/icons-react";
import { SceneLinkManagerModal } from "../SceneLinkManagerModal";
import { useDialog } from "@/providers/DialogProvider/DialogProvider";
import { useMedia } from "@/providers/MediaQueryProvider/MediaQueryProvider";
import { IBlock, IBlockStructureKind } from "@/entities/ConstructorEntities";
import { IBlockInstance, IBlockInstanceSceneLink } from "@/entities/BookEntities";
import { useSceneLinks } from "./hooks/useSceneLinks";
import { BlockInstanceSceneLinkRepository } from "@/repository/BlockInstance/BlockInstanceSceneLinkRepository";
import {bookDb} from "@/entities/bookDb";

interface ISceneLinkManagerProps {
  sceneId: number;
  opened: boolean;
  onClose: () => void;
}

export const SceneLinkManager = (props: ISceneLinkManagerProps) => {
  const { sceneId, opened, onClose } = props;

  const [selectedBlock, setSelectedBlock] = useState<IBlock | null>(null);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [newLinkTitle, setNewLinkTitle] = useState("");

  const { showDialog } = useDialog();

  const { blocks, links, blockInstances } = useSceneLinks(sceneId);

  if (!blocks || !links || !blockInstances) return null;

  const handleCreateLink = async (blockInstanceUuid: string) => {
    if (!selectedBlock) return;
    const newLink: IBlockInstanceSceneLink = {
      blockInstanceUuid,
      sceneId,
      blockUuid: selectedBlock.uuid,
      title: newLinkTitle,
    };
    await BlockInstanceSceneLinkRepository.createLink(bookDb, newLink);
    setNewLinkTitle("");
    closeModal();
  };

  const handleDeleteLink = async (linkId: number, title: string) => {
    const confirmed = await showDialog("Внимание", `Вы действительно хотите удалить ${title}?`);
    if (!confirmed) return;
    await BlockInstanceSceneLinkRepository.deleteLink(bookDb, linkId);
  };

  const handleUpdateLinkTitle = async (linkId: number, newTitle: string) => {
    try {
      await BlockInstanceSceneLinkRepository.updateLink(bookDb, linkId, { title: newTitle });
    } catch (error) {
      console.error("Failed to update link title:", error);
    }
  };

  const getLinkedInstances = (blockUuid: string) =>
      blockInstances.filter(instance =>
          links.some(link =>
              link.blockInstanceUuid === instance.uuid &&
              instance.blockUuid === blockUuid
          )
      );

  const currentBlockInstances = blockInstances.filter(
      instance => instance.blockUuid === selectedBlock?.uuid
  );

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
            <Title order={3} mb="sm" pb="md" w="100%">
              Связи сцены
            </Title>
          }
      >
        <ScrollArea h={`calc(100vh - 120px)`}>
          <List spacing="md">
            {blocks.map(block => {
              const linkedInstances = getLinkedInstances(block.uuid!);
              const blockTitle =
                  block.structureKind === IBlockStructureKind.multiple
                      ? block.titleForms?.plural
                      : block.title;

              return (
                  <Box key={block.uuid} mb="xl">
                    <Group justify="space-between" mb="sm">
                      <Title order={5} c="dimmed" style={{ textTransform: "capitalize", paddingBottom: 4 }}>
                        {blockTitle}
                      </Title>
                      <Button size="xs" onClick={() => {
                        setSelectedBlock(block);
                        openModal();
                      }}>
                        + Добавить
                      </Button>
                    </Group>

                    {linkedInstances.length > 0 ? (
                        <Box>
                          {linkedInstances.map(instance => {
                            const link = links.find(l => l.blockInstanceUuid === instance.uuid);
                            if (!link) return null;

                            return (
                                <Box key={instance.uuid} style={{ margin: 0, width: "100%" }}>
                                  <Group justify="space-between" w="100%">
                                    <div style={{ flex: 1 }}>
                                      <Text fw={100}>{instance.title}</Text>
                                      <Box w="100%">
                                        <InlineEdit2
                                            value={link.title}
                                            onChange={(newTitle) =>
                                                handleUpdateLinkTitle(link.id!, newTitle)
                                            }
                                            size="xs"
                                            placeholder="Введите описание.."
                                        />
                                      </Box>
                                    </div>
                                    <ActionIcon
                                        color="red"
                                        variant="subtle"
                                        onClick={() =>
                                            handleDeleteLink(link.id!, link.title)
                                        }
                                    >
                                      <IconTrash size={16} />
                                    </ActionIcon>
                                  </Group>
                                </Box>
                            );
                          })}
                        </Box>
                    ) : (
                        <Text c="dimmed" size="sm" ml="md">
                          Нет привязанных элементов
                        </Text>
                    )}
                  </Box>
              );
            })}
          </List>
        </ScrollArea>

        {selectedBlock && (
            <SceneLinkManagerModal
                opened={modalOpened}
                onClose={() => {
                  closeModal();
                  setNewLinkTitle("");
                }}
                block={selectedBlock}
                availableInstances={availableInstances}
                linkTitle={newLinkTitle}
                onLinkTitleChange={setNewLinkTitle}
                onSelectInstance={handleCreateLink}
            />
        )}
      </Drawer>
  );
};
