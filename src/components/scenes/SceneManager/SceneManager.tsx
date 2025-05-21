import {
  Container,
  Group,
  Title,
  Button,
  ActionIcon,
  Tooltip,
  Box, TextInput, Select, Collapse, Drawer, Stack, Text
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
  IconFolderOpen,
  IconFolder,
  IconFolderUp,
  IconNote,
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarLeftCollapse, IconChevronLeft,
} from "@tabler/icons-react";
import { usePageTitle } from "@/providers/PageTitleProvider/PageTitleProvider";
import { SceneTable } from "./table/SceneTable";
import { useDisclosure, useDebouncedValue } from "@mantine/hooks";
import { CreateSceneModal } from "./modals/CreateSceneModal";
import { CreateChapterModal } from "./modals/CreateChapterModal";
import { useNavigate } from "react-router-dom";
import { useScenes } from "./useScenes";
import { useChapters } from "./useChapters";
import React, {useEffect, useState} from "react";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import {useBookStore} from "@/stores/bookStore/bookStore";
import {
  IChapter,
  IScene,
  ISceneWithInstances,
  ISceneWithInstancesBlock
} from "@/entities/BookEntities";
import {useLiveQuery} from "dexie-react-hooks";
import {bookDb} from "@/entities/bookDb";

export interface SceneManagerProps {
  openScene: (sceneId: number) => void;
  selectedSceneId?: number | undefined;
  mode?: 'manager' | 'split';
  onToggleMode?: () => void;
  scenes?: ISceneWithInstances[];
  chapters?: IChapter[];
}
export const SceneManager = (props: SceneManagerProps) => {
  const { setPageTitle } = usePageTitle();
  const [openedCreateModal, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);
  const [openedChapterModal, { open: openChapterModal, close: closeChapterModal }] = useDisclosure(false);
  const [chapterForNewScene, setChapterForNewScene] = useState<number | null>(null);

  const [openedFilters, { open: openFilters, close: closeFilters }] = useDisclosure(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchQuery, 400);
  const [selectedBlock, setSelectedBlock] = useState<IBlock | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [availableBlocks, setAvailableBlocks] = useState<IBlock[]>([]);
  const [availableInstances, setAvailableInstances] = useState<any[]>([]);

  const navigate = useNavigate();
  const { isMobile} = useMedia();
  const { collapsedChapters } = useBookStore();
  const {createChapter } = useChapters(props.chapters);

  const {createScene} = useScenes(props.scenes);



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
      .equals(selectedBlock.uuid)
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
            position: 'relative', // Добавляем для корректного позиционирования иконки
            backgroundColor: '#FFFFFF',
            borderRadius: '5px',
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
            paddingTop: '20px',
            maxWidth: isMobile ? undefined : (props.mode === 'manager' ? 'var(--container-size-md)' : '600px'),
            width: props.mode === 'manager' ? 'var(--container-size-md)' : undefined,
          }}
      >
        <Box
            style={{
              position: 'sticky',
              top: isMobile ? 50 : 0,
              zIndex: 100,
              backgroundColor: '#FFFFFF',
              paddingTop: '20px',
              borderBottom: '1px solid #E0E0E0',
            }}
        >
          {props.mode === 'manager' && <ActionIcon
              onClick={props.onToggleMode}
              variant="transparent"
              style={{
                position: 'absolute',
                left: -45,
                top: -20,
                zIndex: 100,
                color: '#999',
                backgroundColor: '#fff', // Цвет фона
                borderBottomLeftRadius: '4px', // Радиус нижнего правого угла
                borderTopLeftRadius: '4px', // Радиус верхнего правого угла
              }}
          >
            <IconChevronLeft
                size={30}
                strokeWidth={1}
            />
          </ActionIcon>
          }

          <Group
              justify="space-between"
              mb="md"
              px="sm"
              wrap={isMobile ? "wrap" : "nowrap"}
          >

            <Title
                order={3}
                visibleFrom={"sm"}
            >
              Сцены и главы
            </Title>
            <Group>
              <Tooltip label="Добавить главу">
                <ActionIcon
                    onClick={openChapterModal}
                >
                  <IconFolderPlus size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Добавить сцену">
                <ActionIcon
                    onClick={() => {
                      setChapterForNewScene(null);
                      openCreateModal();
                    }}
                >
                  <IconNote size={16} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Свернуть все главы">
                <ActionIcon
                    variant="subtle"
                    onClick={collapseAllChapters}
                    disabled={!props.chapters?.length}
                    size={isMobile ? "sm" : "md"}
                >
                  <IconFolderUp size={isMobile ? 18 : 18} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Развернуть все главы">
                <ActionIcon
                    variant="subtle"
                    onClick={expandAllChapters}
                    disabled={!collapsedChapters.length}
                    size={isMobile ? "sm" : "md"}
                >
                  <IconFolderOpen size={isMobile ? 18 : 18} />
                </ActionIcon>
              </Tooltip>
            </Group>
            <Group ml="auto" gap={8}>
              <Tooltip label="Фильтры">
                <ActionIcon
                    variant={openedFilters ? "filled" : "subtle"}
                    onClick={openFilters}
                >
                  <IconFilter size={16} />
                </ActionIcon>
              </Tooltip>

              {(debouncedSearch || selectedInstance) && (
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
          <Group>
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
            scenes={props.scenes}
            chapters={props.chapters}
            searchQuery={debouncedSearch}
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

        <Drawer
            opened={openedFilters}
            onClose={closeFilters}
            title="Фильтры"
            position="right"
            size={isMobile ? "100%" : "400px"}
            padding="md"
        >
          <Stack>
            <Group gap="md" align="flex-end">
              <TextInput
                  placeholder="Поиск по названию..."
                  leftSection={<IconSearch size={14} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.currentTarget.value)}
                  style={{ flex: 1 }}
              />
            </Group>
            <Text>Поиск по базе знаний</Text>
            <Group gap="md" align="flex-end">
              <Select
                  placeholder="Элемент базы знаний"
                  data={availableBlocks.map(b => ({ value: b.uuid, label: b.titleForms?.plural }))}
                  value={selectedBlock ? selectedBlock?.uuid : ''}
                  onChange={(uuid) => setSelectedBlock(availableBlocks.find(b => b.uuid === uuid))}
                  clearable
              />

              <Select
                  placeholder={selectedBlock ? selectedBlock?.title : ''}
                  data={availableInstances.map(i => ({ value: i.uuid, label: i.title }))}
                  value={selectedInstance}
                  onChange={setSelectedInstance}
                  disabled={!selectedBlock}
                  clearable
              />
            </Group>
          </Stack>
        </Drawer>
      </Container>
  );
};
