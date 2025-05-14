// src/components/scenes/SceneManager/SceneRow.tsx
import { ActionIcon, Group, Table } from "@mantine/core";
import {
  IconEdit,
  IconTrash,
  IconArrowRightCircle,
  IconArrowUp,
  IconArrowDown
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useDisclosure } from "@mantine/hooks";
import { DeleteConfirmationModal } from "../modals/DeleteConfirmationModal";
import { MoveSceneModal } from "../modals/MoveSceneModal";
import { useScenes } from "../useScenes";
import {notifications} from "@mantine/notifications";
import {bookDb} from "@/entities/bookDb";

interface SceneRowProps {
  scene: {
    id: number;
    title: string;
    order?: number;
    chapterId?: number;
  };
  onDelete?: (id: number) => void;
  scenesInChapter: Array<{ id: number }>;
}

export const SceneRow = ({ scene, onDelete, scenesInChapter }: SceneRowProps) => {
  const navigate = useNavigate();
  const [openedDeleteModal, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [openedMoveModal, { open: openMoveModal, close: closeMoveModal }] = useDisclosure(false);
  const { recalculateGlobalOrder, reorderScenes } = useScenes();
  const currentIndex = scenesInChapter.findIndex(s => s.id === scene.id);

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
    if (onDelete) {
      onDelete(scene.id);
    }
    closeDeleteModal();
  };

  const handleMove = async (newChapterId: number | null) => {
    try {
      // Передаем данные о перемещении в recalculateGlobalOrder
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
        <Table.Tr key={`scene-${scene.id}`} highlightOnHover>
          <Table.Td
              style={{ paddingLeft: 32, cursor: 'pointer'}}
              onClick={() => navigate(`/scene/card?id=${scene.id}`)}
          >
            {scene.order ? `${scene.order}. ` : ''}{scene.title}
          </Table.Td>
          <Table.Td >
            <Group>
              <ActionIcon
                  variant="subtle"
                  onClick={handleMoveUp}
                  disabled={currentIndex <= 0}
                  title="Переместить вверх"
              >
                <IconArrowUp size={16} />
              </ActionIcon>
              <ActionIcon
                  variant="subtle"
                  onClick={handleMoveDown}
                  disabled={currentIndex >= scenesInChapter.length - 1}
                  title="Переместить вниз"
              >
                <IconArrowDown size={16} />
              </ActionIcon>
              <ActionIcon
                  variant="subtle"
                  onClick={openMoveModal}
                  title="Перенести в другую главу"
              >
                <IconArrowRightCircle size={16} />
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
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
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
