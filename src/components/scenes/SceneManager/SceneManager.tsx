import {
  Container,
  Group,
  Title,
  Button,
  ActionIcon,
  Tooltip,
  LoadingOverlay,
  Box
} from "@mantine/core";
import { IconPlus, IconFolderOff, IconFolderPlus } from "@tabler/icons-react";
import { usePageTitle } from "@/providers/PageTitleProvider/PageTitleProvider";
import { SceneTable } from "./table/SceneTable";
import { useDisclosure } from "@mantine/hooks";
import { CreateSceneModal } from "./modals/CreateSceneModal";
import { CreateChapterModal } from "./modals/CreateChapterModal";
import { useNavigate } from "react-router-dom";
import { useScenes } from "./useScenes";
import { useChapters } from "./useChapters";
import React, {useState} from "react";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import {useBookStore} from "@/stores/bookStore/bookStore";
import {IScene} from "@/entities/BookEntities";

export interface SceneManagerProps {
  openScene: (sceneId: number) => void;
  selectedSceneId?: number | undefined;
}
export const SceneManager = (props: SceneManagerProps) => {
  const { setPageTitle } = usePageTitle();
  const [openedCreateModal, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);
  const [openedChapterModal, { open: openChapterModal, close: closeChapterModal }] = useDisclosure(false);
  const [chapterForNewScene, setChapterForNewScene] = useState<number | null>(null);
  const navigate = useNavigate();
  const { isMobile} = useMedia();
  const { collapsedChapters } = useBookStore();
  const { chapters } = useChapters();

  const { createScene, scenes } = useScenes();
  const { createChapter } = useChapters();

  setPageTitle('Сцены и главы');

  const handleCreateScene = async (title: string) => {
    if (!title.trim()) return;
    try {
      const newSceneId = await createScene(title, chapterForNewScene ?? undefined);
      closeCreateModal();
      setChapterForNewScene(null);
      if (isMobile) {
        navigate(`/scene/card?id=${newSceneId}`);
      } else {
       props.openScene(newSceneId);
      }
    } catch (error) {
      console.error("Failed to create scene:", error);
    }
  };

  const handleCreateChapter = async (title: string) => {
    if (!title.trim()) return;
    try {
      await createChapter(title);
      closeChapterModal();
    } catch (error) {
      console.error("Failed to create chapter:", error);
    }
  };

  const collapseAllChapters = () => {
    // Get all chapter IDs that aren't already collapsed
    const chapterIds = chapters?.map(chapter => chapter.id) || [];
    // Add all chapters to collapsed chapters
    const store = useBookStore.getState();
    const currentCollapsed = store.collapsedChapters;

    // For each chapter that isn't already collapsed, add it to the collapsed list
    chapterIds.forEach(id => {
      if (!currentCollapsed.includes(id)) {
        store.toggleChapterCollapse(id);
      }
    });
  };

  const expandAllChapters = () => {
    // Get current collapsed chapters
    const store = useBookStore.getState();
    const currentCollapsed = [...store.collapsedChapters];

    // Toggle each collapsed chapter to expand them all
    currentCollapsed.forEach(id => {
      store.toggleChapterCollapse(id);
    });
  };
  if (!scenes || !chapters) return (
      <LoadingOverlay
          zIndex={1000}
          visible={true}
          overlayProps={{ radius: 'sm', blur: 2 }}
          loaderProps={{ color: 'blue', type: 'bars' }}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0}}
      />
  );
  return (
      <Container
          fluid={isMobile}
          p={isMobile ? '0' : 'lg'}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '5px',
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
            paddingTop: '20px',
          }}
      >
        <Box
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 100,
              backgroundColor: '#FFFFFF',
              paddingTop: '20px',
              borderBottom: '1px solid #E0E0E0',
            }}
        >
          <Group
              justify="space-between"
              mb="md"
              px="sm"
              wrap={isMobile ? "wrap" : "nowrap"}
          >

            {isMobile ? (
                <Group position="right" spacing={8} style={{width: '100%', marginTop: '10px'}}>
                  <Button
                      leftSection={<IconPlus size={14} />}
                      onClick={openChapterModal}
                      size="xs"
                      variant="outline"
                      compact
                  >
                    Новая глава
                  </Button>
                  <Button
                      leftSection={<IconPlus size={14} />}
                      onClick={() => {
                        setChapterForNewScene(null);
                        openCreateModal();
                      }}
                      size="xs"
                      compact
                  >
                    Новая сцена
                  </Button>
                </Group>
            ) : (
                <Group>
                  <Title visibleFrom="sm" order={1} size="h4">Сцены и главы</Title>
                  <Button
                      leftSection={<IconPlus size={16} />}
                      onClick={openChapterModal}
                      size="sm"
                      variant="outline"
                  >
                    Новая глава
                  </Button>
                  <Button
                      leftSection={<IconPlus size={16} />}
                      onClick={() => {
                        setChapterForNewScene(null);
                        openCreateModal();
                      }}
                      size="sm"
                  >
                    Новая сцена
                  </Button>
                </Group>
            )}
          </Group>

          <Group>

            <Group ml={isMobile ? "md" : "md"} spacing={8}>
              <Tooltip label="Свернуть все главы">
                <ActionIcon
                    variant="subtle"
                    onClick={collapseAllChapters}
                    disabled={!chapters?.length}
                    size={isMobile ? "sm" : "md"}
                >
                  <IconFolderOff size={isMobile ? 18 : 18} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Развернуть все главы">
                <ActionIcon
                    variant="subtle"
                    onClick={expandAllChapters}
                    disabled={!collapsedChapters.length}
                    size={isMobile ? "sm" : "md"}
                >
                  <IconFolderPlus size={isMobile ? 18 : 18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
        </Box>

        <SceneTable
            openCreateModal={(chapterId) => {
              setChapterForNewScene(chapterId);
              openCreateModal();
            }}
            openScene={props.openScene}
            selectedSceneId={props.selectedSceneId}
        />

        <CreateSceneModal
            opened={openedCreateModal}
            onClose={() => {
              closeCreateModal();
              setChapterForNewScene(null);
            }}
            onCreate={handleCreateScene}
        />

        <CreateChapterModal
            opened={openedChapterModal}
            onClose={closeChapterModal}
            onCreate={handleCreateChapter}
        />
      </Container>
  );
};
