import { Container, Group, Title, Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { usePageTitle } from "@/providers/PageTitleProvider/PageTitleProvider";
import { SceneTable } from "./table/SceneTable";
import { useDisclosure } from "@mantine/hooks";
import { CreateSceneModal } from "./modals/CreateSceneModal";
import { CreateChapterModal } from "./modals/CreateChapterModal";
import { useNavigate } from "react-router-dom";
import { useScenes } from "./useScenes";
import { useChapters } from "./useChapters";
import {useState} from "react";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";

export const SceneManager = () => {
  const { setPageTitle } = usePageTitle();
  const [openedCreateModal, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);
  const [openedChapterModal, { open: openChapterModal, close: closeChapterModal }] = useDisclosure(false);
  const [chapterForNewScene, setChapterForNewScene] = useState<number | null>(null);
  const navigate = useNavigate();
  const { isMobile} = useMedia();

  const { createScene } = useScenes();
  const { createChapter } = useChapters();

  setPageTitle('Сцены и главы');

  const handleCreateScene = async (title: string) => {
    if (!title.trim()) return;
    try {
      const newSceneId = await createScene(title, chapterForNewScene ?? undefined);
      closeCreateModal();
      setChapterForNewScene(null);
      navigate(`/scene/card?id=${newSceneId}`);
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
        <Group justify="space-between" mb="md" px="sm">
          <Title visibleFrom="sm" order={1} size="h4">Сцены и главы</Title>
          <Group style={{marginTop: isMobile ? '20px' : '0'}}>
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
        </Group>

        <SceneTable
            openCreateModal={(chapterId) => {
              setChapterForNewScene(chapterId);
              openCreateModal();
            }}
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
