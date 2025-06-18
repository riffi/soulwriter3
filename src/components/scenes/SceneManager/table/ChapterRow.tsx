import { Box, Collapse, ActionIcon, Table } from "@mantine/core";
import {
    IconChevronDown,
    IconChevronRight,
    IconFolder,
    IconFolderOpen,
    IconPlus,
    IconEdit,
    IconTrash,
    IconNote
} from "@tabler/icons-react";
import { SceneRow } from "./SceneRow";
import { useChapters } from "../useChapters";
import { EditChapterModal } from "../modals/EditChapterModal";
import { DeleteConfirmationModal } from "../modals/DeleteConfirmationModal";
import {useDisclosure} from "@mantine/hooks";
import {useScenes} from "@/components/scenes/SceneManager/useScenes";
import {IChapter, IScene, ISceneWithInstances} from "@/entities/BookEntities";
import {useBookStore} from "@/stores/bookStore/bookStore";

interface ChapterRowProps {
  chapter: IChapter;
  scenes: ISceneWithInstances[];
  chapters: IChapter[];
  onAddScene: () => void;
  openScene: (sceneId: number) => void;
  selectedSceneId?: number;
  mode?: 'manager' | 'split';
  chapterOnly?: boolean;
}

export const ChapterRow = ({ chapter, scenes, onAddScene, openScene, selectedSceneId, mode, chapters, chapterOnly }: ChapterRowProps) => {
  const { collapsedChapters, toggleChapterCollapse } = useBookStore();
  const isExpanded = !collapsedChapters.includes(chapter.id);
  const [openedEditModal, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
  const [openedDeleteModal, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const { deleteChapter, updateChapter } = useChapters(chapters);
  const { deleteScene } = useScenes(scenes);


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
                  backgroundColor: chapterOnly ? 'white'  : 'var(--mantine-color-gray-0)',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  if (chapterOnly) {
                    if (chapter.contentSceneId !== undefined) {
                      openScene(chapter.contentSceneId);
                    }
                  } else {
                    toggleChapterCollapse(chapter.id);
                  }
                }}
            >
              {!chapterOnly && (
                  <ActionIcon variant="transparent" mr="sm">
                    {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
                  </ActionIcon>
              )}
              {(!chapterOnly && isExpanded) ? <IconFolderOpen size={18} /> : <IconNote size={18} />}
              <span style={{
                  marginLeft: 8,
                  fontWeight: chapterOnly ? 400 : 600,
                  fontSize: '0.8rem' }}>
                {chapter.order ? `${chapter.order}. ` : ''} {chapter.title}
              </span>
              <Box ml="auto" style={{ display: 'flex', gap: '8px' }}>
                {!chapterOnly && (
                    <ActionIcon
                        variant="subtle"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddScene();
                        }}
                    >
                      <IconPlus size={16} />
                    </ActionIcon>
                )}
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

            {!chapterOnly && (
                <Collapse in={isExpanded}>
                  <Table highlightOnHover>
                    <Table.Tbody>
                    {scenes.map((scene, index, array) => (
                        <SceneRow
                            key={`scene-${scene.id}`}
                            scene={scene}
                            scenesInChapter={array}
                            onUpdateChapter={handleDeleteScene}
                            openScene={openScene}
                            selectedSceneId={selectedSceneId}
                            mode={mode}
                            chapters={chapters}
                            scenes={scenes}
                        />
                    ))}
                    </Table.Tbody>
                  </Table>
                </Collapse>
            )}
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
