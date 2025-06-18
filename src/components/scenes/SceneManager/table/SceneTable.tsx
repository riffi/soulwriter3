import {Table, Text, Paper, Center, Group, LoadingOverlay} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useScenes } from "../useScenes";
import { useChapters } from "../useChapters";
import { ChapterRow } from "./ChapterRow";
import { SceneRow } from "./SceneRow";
import React from "react";
import {IChapter, IScene, ISceneWithInstances} from "@/entities/BookEntities";
import {useLiveQuery} from "dexie-react-hooks";

interface SceneTableProps {
  openCreateModal: (chapterId: number) => void;
  openScene: (sceneId: number) => void;
  selectedSceneId?: number;
  mode?: 'manager' | 'split';
  scenes?: ISceneWithInstances[];
  chapters?: IChapter[];
  searchQuery?: string;
  selectedInstanceUuid?: string | null;
  chapterOnly?: boolean;
}

export const SceneTable = ({
                             openCreateModal,
                             openScene,
                             selectedSceneId,
                             mode,
                             scenes,
                             chapters,
                             searchQuery,
                             selectedInstanceUuid,
                             chapterOnly
                           }: SceneTableProps) => {

  // Функция фильтрации сцен
  const filterScenes = (scenes: ISceneWithInstances[]) => {
    return scenes.filter(scene => {
      if (!searchQuery && !selectedInstanceUuid) {
          return true;
      }
      const matchesSearch = scene.title.toLowerCase().includes(searchQuery?.toLowerCase() || '') ||
          chapters?.find(c => c.id === scene.chapterId)?.title.toLowerCase().includes(searchQuery?.toLowerCase() || '');

      const matchesInstance = !selectedInstanceUuid ||
          scene.blockInstances.some(bi =>
              bi.instances.some(i => i.uuid === selectedInstanceUuid)
          );

      return matchesSearch && matchesInstance;
    });
  };

  // Функция фильтрации глав
  const filterChapters = (chapters: IChapter[], filteredScenes: ISceneWithInstances[]) => {
    if (chapterOnly) {
      return chapters.filter(chapter =>
          !searchQuery || chapter.title.toLowerCase().includes(searchQuery?.toLowerCase() || '')
      );
    }
    return chapters.filter(chapter => {
      if (!searchQuery && !selectedInstanceUuid) {
        return true;
      }
      const hasScenes = filteredScenes.some(scene => scene.chapterId === chapter.id);
      return hasScenes;
    });
  };

  const filteredScenes = scenes ? filterScenes(scenes) : [];
  const filteredChapters = chapters ? filterChapters(chapters, filteredScenes) : [];

  // Получение сцен для главы с учетом фильтрации
  const getScenesForChapter = (chapterId: number | null) => {
    return filteredScenes.filter(scene =>
        chapterId ? scene.chapterId === chapterId : !scene.chapterId
    );
  };

  if (!scenes || !chapters)  return (
      <LoadingOverlay
          zIndex={1000}
          visible={true}
          overlayProps={{ radius: 'sm', blur: 2 }}
          loaderProps={{ color: 'blue', type: 'bars' }}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0}}
      />
  )

  if (!scenes?.length && !chapters?.length) {
    return (
        <Paper withBorder p="lg" radius="md" shadow="sm">
          <Center mih={120}>
            <Group gap="xs" c="dimmed">
              <IconPlus size={18} />
              <Text size="sm">Добавьте первую сцену или главу</Text>
            </Group>
          </Center>
        </Paper>
    );
  }

  return (
      <Table
          horizontalSpacing="sm"
          verticalSpacing="sm"
          layout={"auto"}
      >

        <Table.Tbody>
          {filteredChapters?.map((chapter) => (
              <ChapterRow
                  key={`chapter-${chapter.id}`}
                  chapter={chapter}
                  scenes={chapterOnly ? [] : getScenesForChapter(chapter.id)}
                  onAddScene={() => openCreateModal(chapter.id)}
                  openScene={openScene}
                  selectedSceneId={selectedSceneId}
                  mode={mode}
                  chapters={chapters}
                  chapterOnly={chapterOnly}
              />
          ))}
          {!chapterOnly && getScenesForChapter(null).map((scene, index, array) => (
              <SceneRow
                  key={`scene-${scene.id}`}
                  scene={scene}
                  scenesInChapter={array}
                  // onDelete={handleDelete}
                  openScene={openScene}
                  selectedSceneId={selectedSceneId}
                  mode={mode}
                  scenes={scenes}
                  chapters={chapters}
              />
          ))}
        </Table.Tbody>
      </Table>
  );
};
