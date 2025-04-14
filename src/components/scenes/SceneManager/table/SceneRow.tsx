// src/components/scenes/SceneManager/SceneRow.tsx
import { ActionIcon, Group, Table } from "@mantine/core";
import { IconEdit, IconTrash, IconArrowRightCircle} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useDisclosure } from "@mantine/hooks";
import { DeleteConfirmationModal } from "../modals/DeleteConfirmationModal";
import { MoveSceneModal } from "../modals/MoveSceneModal";
import { useScenes } from "../useScenes";

interface SceneRowProps {
  scene: {
    id: number;
    title: string;
    order?: number;
    chapterId?: number;
  };
  onDelete?: (id: number) => void;
}

export const SceneRow = ({ scene, onDelete, onMove }: SceneRowProps) => {
  const navigate = useNavigate();
  const [openedDeleteModal, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [openedMoveModal, { open: openMoveModal, close: closeMoveModal }] = useDisclosure(false);
  const { updateScene } = useScenes();

  const handleDelete = () => {
    if (onDelete) {
      onDelete(scene.id);
    }
    closeDeleteModal();
  };

  const handleMove = async (chapterId: number | null) => {
    await updateScene(scene.id, { chapterId });
    closeMoveModal();
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
          <Table.Td style={{ width: '150px' }}>
            <Group>
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
