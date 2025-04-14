import { Box, Collapse, ActionIcon, Group } from "@mantine/core";
import { IconChevronDown, IconChevronRight, IconFolder, IconFolderOpen, IconPlus, IconEdit, IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import { SceneRow } from "./SceneRow";
import { Table } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useChapters } from "../useChapters";
import { EditChapterModal } from "../modals/EditChapterModal";
import { DeleteConfirmationModal } from "../modals/DeleteConfirmationModal";
import {useDisclosure} from "@mantine/hooks";
import {useScenes} from "@/components/scenes/SceneManager/useScenes";

interface ChapterRowProps {
  chapter: {
    id: number;
    title: string;
  };
  scenes: Array<{
    id: number;
    title: string;
    order: number;
  }>;
  onAddScene: () => void;
}

export const ChapterRow = ({ chapter, scenes, onAddScene }: ChapterRowProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [openedEditModal, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
  const [openedDeleteModal, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const { deleteChapter, updateChapter } = useChapters();
  const { deleteScene } = useScenes();
  const navigate = useNavigate();

  const toggleChapter = () => setIsExpanded(!isExpanded);

  const handleDeleteChapter = async () => {
    try {
      await deleteChapter(chapter.id);
      closeDeleteModal();
    } catch (error) {
      console.error("Failed to delete chapter:", error);
    }
  };

  const handleUpdateChapter = async (newTitle: string) => {
    try {
      await updateChapter(chapter.id, newTitle);
      closeEditModal();
    } catch (error) {
      console.error("Failed to update chapter:", error);
    }
  };

  const handleDeleteScene = async (sceneId: number) => {
    try {
      await deleteScene(sceneId);
    } catch (error) {
      console.error("Failed to delete scene:", error);
    }
  };

  return (
      <>
        <Table.Tr key={`chapter-${chapter.id}`}>
          <Table.Td colSpan={2} style={{ padding: 0 }}>
            <Box
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 16px',
                  backgroundColor: 'var(--mantine-color-gray-0)',
                  cursor: 'pointer'
                }}
                onClick={toggleChapter}
            >
              <ActionIcon variant="transparent" mr="sm">
                {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
              </ActionIcon>
              {isExpanded ? <IconFolderOpen size={18} /> : <IconFolder size={18} />}
              <span style={{ marginLeft: 8, fontWeight: 600 }}>{chapter.title}</span>
              <Box ml="auto" style={{ display: 'flex', gap: '8px' }}>
                <ActionIcon
                    variant="subtle"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddScene();
                    }}
                >
                  <IconPlus size={16} />
                </ActionIcon>
                <ActionIcon
                    variant="subtle"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal();
                    }}
                >
                  <IconEdit size={16} />
                </ActionIcon>
                <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal();
                    }}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Box>
            </Box>

            <Collapse in={isExpanded}>
              {scenes.map((scene) => (
                  <SceneRow
                      key={`scene-${scene.id}`}
                      scene={scene}
                      onDelete={() => handleDeleteScene(scene.id)}
                  />
              ))}
            </Collapse>
          </Table.Td>
        </Table.Tr>

        <EditChapterModal
            opened={openedEditModal}
            onClose={closeEditModal}
            chapter={chapter}
            onUpdate={handleUpdateChapter}
        />

        <DeleteConfirmationModal
            opened={openedDeleteModal}
            onClose={closeDeleteModal}
            onConfirm={handleDeleteChapter}
            title="Удалить главу?"
            message="Все сцены в этой главе будут перемещены в корень."
        />
      </>
  );
};
