// src/components/scenes/SceneManager/SceneRow.tsx
import {ActionIcon, Box, Text, Table, Stack, Group} from "@mantine/core";
import {
  IconTrash,
  IconArrowRightCircle,
  IconArrowUp,
  IconArrowDown
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import {useDisclosure, useHover} from "@mantine/hooks";
import { DeleteConfirmationModal } from "../modals/DeleteConfirmationModal";
import { MoveSceneModal } from "../modals/MoveSceneModal";
import { useScenes } from "../useScenes";
import {notifications} from "@mantine/notifications";
import {
  IChapter,
  ISceneWithInstances,
} from "@/entities/BookEntities";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import {IconViewer} from "@/components/shared/IconViewer/IconViewer";

interface SceneRowProps {
  scene: ISceneWithInstances;
  scenesInChapter: Array<{ id: number }>;
  openScene: (sceneId: number) => void;
  scenes: ISceneWithInstances[];
  chapters: IChapter[];
  selectedSceneId?: number;
  mode?: 'manager' | 'split';
}

export const SceneRow = ({ scene, scenesInChapter, openScene, selectedSceneId, scenes, chapters, mode }: SceneRowProps) => {
  const navigate = useNavigate();
  const [openedDeleteModal, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [openedMoveModal, { open: openMoveModal, close: closeMoveModal }] = useDisclosure(false);
  const { recalculateGlobalOrder, reorderScenes, deleteScene } = useScenes(scenes);
  const currentIndex = scenesInChapter.findIndex(s => s.id === scene.id);
  const { hovered, ref } = useHover();
  const { isMobile } = useMedia();

  const handleMoveUp = () => {
    const prevScene = scenesInChapter[currentIndex - 1];
    if (prevScene) {
      reorderScenes(scene.id, prevScene.id);
    }
  };

  const handleMoveDown = () => {
    const nextScene = scenesInChapter[currentIndex + 1];
    if (nextScene) {
      reorderScenes(scene.id, nextScene.id);
    }
  };

  const handleDelete = () => {
    deleteScene(scene.id);
    closeDeleteModal();
  };

  const handleClick = () => {
     openScene(scene.id);
  };

  const handleMove = async (newChapterId: number | null) => {
    try {
      await recalculateGlobalOrder({
        id: scene.id,
        newChapterId
      });

      closeMoveModal();
      notifications.show({
        title: "Успех",
        message: "Сцена перемещена",
        color: "green"
      });
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось переместить сцену",
        color: "red"
      });
    }
  };

  return (
      <>
        <Table.Tr
            key={`scene-${scene.id}`}
            ref={ref}
            style={{
              backgroundColor: selectedSceneId === scene.id ? '#e6f7ff' : 'white'
            }}
        >
          <Table.Td
              colSpan={2}
              style={{
                paddingLeft: scene.chapterId ? 30 : 10,
                cursor: 'pointer',
              }}
          >
            <Box
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={handleClick}
            >
              <Stack gap={0}>
                <Text style={{fontSize: 14, color: '#444'}}>
                  {scene.order ? `${scene.order}. ` : ''}{scene.title}
                </Text>
                {mode ==='manager' && <>
                {scene?.blockInstances.map((sceneWithInstancesBlock) => (
                    <Group gap={5}>
                      <IconViewer
                          iconName={sceneWithInstancesBlock.block.icon}
                          size={14}
                          color={"gray"}
                          backgroundColor={"transparent"}
                      />
                      <Text style={{fontSize: 12, color: '#7a7a7a'}}>
                        {sceneWithInstancesBlock.block.titleForms?.plural}:
                      </Text>

                        {sceneWithInstancesBlock.instances.map((instance) =>(
                            <Text
                              key={`instance-${instance.id}`}
                              style={{
                                fontSize: "10px",
                                fontWeight: 'normal',
                                backgroundColor: '#a4a4a4',
                                padding: '0px 3px',
                                borderRadius: '3px',
                                margin: '0px',
                                color: '#fff'
                              }}
                            >
                              {instance.title}
                            </Text>
                        ))}
                    </Group>
                  ))}

                  <Text style={{fontSize: 11, color: '#999'}}>
                    Символов: {scene.totalSymbolCountWithSpaces}
                  </Text>
                </>
                }
              </Stack>
              <Box
                  ml="auto"
                  style={{
                    display: 'flex',
                    gap: '8px',
                    transition: 'opacity 0.2s ease',
                    opacity: hovered? 1 : 0
                  }}
              >
                <ActionIcon
                    variant="subtle"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveUp()
                    }}
                    disabled={currentIndex <= 0}
                    title="Переместить вверх"
                >
                  <IconArrowUp size={16}/>
                </ActionIcon>
                <ActionIcon
                    variant="subtle"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveDown()
                    }}
                     disabled={currentIndex >= scenesInChapter.length - 1}
                    title="Переместить вниз"
                >
                  <IconArrowDown size={16}/>
                </ActionIcon>
                <ActionIcon
                    variant="subtle"
                    handleMoveDown
                    onClick={(e) => {
                      e.stopPropagation();
                      openMoveModal()
                    }}
                   title="Перенести в другую главу"
                >
                  <IconArrowRightCircle size={16}/>
                </ActionIcon>
                <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal();
                    }}
                    title="Удалить"
                >
                  <IconTrash size={16}/>
                </ActionIcon>
              </Box>
            </Box>
          </Table.Td>
        </Table.Tr>

        <DeleteConfirmationModal
            opened={openedDeleteModal}
            onClose={closeDeleteModal}
            onConfirm={handleDelete}
            title="Удалить сцену?"
            message="Вы уверены, что хотите удалить эту сцену?"
        />

        <MoveSceneModal
            opened={openedMoveModal}
            onClose={closeMoveModal}
            onMove={handleMove}
            currentChapterId={scene.chapterId}
        />
      </>
  );
};
