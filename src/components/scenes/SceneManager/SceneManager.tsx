import {
  Container,
  Group,
  Title,
  Button,
  ActionIcon,
  Tooltip,
  Box, TextInput, Select, Collapse
} from "@mantine/core";
import {
  IconPlus,
  IconFolderOff,
  IconFolderPlus,
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconFilter,
  IconX,
  IconSearch,
} from "@tabler/icons-react";
import { usePageTitle } from "@/providers/PageTitleProvider/PageTitleProvider";
import { SceneTable } from "./table/SceneTable";
import { useDisclosure } from "@mantine/hooks";
import { CreateSceneModal } from "./modals/CreateSceneModal";
import { CreateChapterModal } from "./modals/CreateChapterModal";
import { useNavigate } from "react-router-dom";
import { useScenes } from "./useScenes";
import { useChapters } from "./useChapters";
import React, {useEffect, useState} from "react";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import {useBookStore} from "@/stores/bookStore/bookStore";
import {IChapter, IScene} from "@/entities/BookEntities";
import {useLiveQuery} from "dexie-react-hooks";
import {bookDb} from "@/entities/bookDb";

export interface SceneManagerProps {
  openScene: (sceneId: number) => void;
  selectedSceneId?: number | undefined;
  mode?: 'manager' | 'split';
  onToggleMode?: () => void;
  scenes?: IScene[];
  chapters?: IChapter[];
}
export const SceneManager = (props: SceneManagerProps) => {
  const { setPageTitle } = usePageTitle();
  const [openedCreateModal, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);
  const [openedChapterModal, { open: openChapterModal, close: closeChapterModal }] = useDisclosure(false);
  const [chapterForNewScene, setChapterForNewScene] = useState<number | null>(null);
  const [isFiltersOpen, { toggle: toggleFilters }] = useDisclosure(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [availableBlocks, setAvailableBlocks] = useState<IBlock[]>([]);
  const [availableInstances, setAvailableInstances] = useState<any[]>([]);

  const navigate = useNavigate();
  const { isMobile} = useMedia();
  const { collapsedChapters } = useBookStore();
  const {  createChapter } = useChapters(props.chapters);

  const {getScenesWithBlockInstances,  createScene} = useScenes(props.scenes);

  // Добавляем к сценам привязки к экземплярам блоков
  const scenesWithBlockInstances = useLiveQuery(() =>
          getScenesWithBlockInstances(props.scenes),
      [props.scenes]
  );

  useEffect(() =>{
    setPageTitle('Сцены и главы');
  }, [])

  useEffect(() => {
    const loadBlocks = async () => {
      const blocks = await bookDb.blocks
      .filter(b => b.showInSceneList === 1)
      .toArray();
      setAvailableBlocks(blocks);
    };
    loadBlocks();
  }, []);

  useEffect(() => {
    const loadInstances = async () => {
      if (!selectedBlock) return;
      const instances = await bookDb.blockInstances
      .where('blockUuid')
      .equals(selectedBlock)
      .toArray();
      setAvailableInstances(instances);
    };
    loadInstances();
  }, [selectedBlock]);


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
    const chapterIds = props.chapters?.map(chapter => chapter.id) || [];
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

  return (
      <Container
          fluid={isMobile}
          p={isMobile ? '0' : 'lg'}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '5px',
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
            paddingTop: '20px',
            maxWidth: isMobile || props.mode === 'manager' ? undefined : '600px',
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
          {!isMobile && (
              <Tooltip
                  label={props.mode === 'split' ? "Развернуть редактор" : "Свернуть редактор"}
              >
                <ActionIcon
                    variant="subtle"
                    onClick={props.onToggleMode}
                    size="md"
                    style={{
                      position: 'absolute',
                      right: '-10px',
                      top: '-15px',
                      color: 'grey',
                    }}
                >
                  {props.mode === 'split' ? (
                      <IconArrowsMaximize size={18} />
                  ) : (
                      <IconArrowsMinimize size={18} />
                  )}
                </ActionIcon>
              </Tooltip>
          )}
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
            <Group ml="auto" gap={8}>
              <Tooltip label="Фильтры">
                <ActionIcon
                    variant={isFiltersOpen ? "filled" : "subtle"}
                    onClick={toggleFilters}
                >
                  <IconFilter size={16} />
                </ActionIcon>
              </Tooltip>

              {(searchQuery || selectedInstance) && (
                  <Tooltip label="Очистить фильтры">
                    <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedBlock(null);
                          setSelectedInstance(null);
                        }}
                    >
                      <IconX size={16} />
                    </ActionIcon>
                  </Tooltip>
              )}
            </Group>
          </Group>
          <Collapse in={isFiltersOpen}>
            <Group p="md" gap="md" align="flex-end">
              <TextInput
                  placeholder="Поиск по названию..."
                  leftSection={<IconSearch size={14} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.currentTarget.value)}
                  style={{ flex: 1 }}
              />

              <Select
                  placeholder="Выберите блок"
                  data={availableBlocks.map(b => ({ value: b.uuid, label: b.titleForms?.plural }))}
                  value={selectedBlock}
                  onChange={setSelectedBlock}
                  clearable
              />

              <Select
                  placeholder="Выберите инстанс"
                  data={availableInstances.map(i => ({ value: i.uuid, label: i.title }))}
                  value={selectedInstance}
                  onChange={setSelectedInstance}
                  disabled={!selectedBlock}
                  clearable
              />
            </Group>
          </Collapse>
          <Group>

            <Group ml={isMobile ? "md" : "md"} spacing={8}>
              <Tooltip label="Свернуть все главы">
                <ActionIcon
                    variant="subtle"
                    onClick={collapseAllChapters}
                    disabled={!props.chapters?.length}
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
            mode={props.mode}
            scenes={scenesWithBlockInstances}
            chapters={props.chapters}
            searchQuery={searchQuery}
            selectedInstanceUuid={selectedInstance}
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
