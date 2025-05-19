import {Table, Text, Paper, Center, Group, LoadingOverlay} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useScenes } from "../useScenes";
import { useChapters } from "../useChapters";
import { ChapterRow } from "./ChapterRow";
import { SceneRow } from "./SceneRow";
import React from "react";
import {IChapter, IScene} from "@/entities/BookEntities";

interface SceneTableProps {
  openCreateModal: (chapterId: number) => void;
  openScene: (sceneId: number) => void;
  selectedSceneId?: number;
}

export const SceneTable = ({ openCreateModal, openScene, selectedSceneId }: SceneTableProps) => {
  const { scenes } = useScenes();
  const { chapters } = useChapters();

  const getScenesForChapter = (chapterId: number | null) => {
    return scenes?.filter(scene =>
        chapterId ? scene.chapterId === chapterId : ((scene.chapterId === null) || (scene.chapterId === undefined))
    ) || [];
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
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Название</Table.Th>
            <Table.Th w={150}>Действия</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {chapters?.map((chapter) => (
              <ChapterRow
                  key={`chapter-${chapter.id}`}
                  chapter={chapter}
                  scenes={getScenesForChapter(chapter.id)}
                  onAddScene={() => openCreateModal(chapter.id)}
                  openScene={openScene}
                  selectedSceneId={selectedSceneId}
              />
          ))}
          {getScenesForChapter(null).map((scene, index, array) => (
              <SceneRow
                  key={`scene-${scene.id}`}
                  scene={scene}
                  scenesInChapter={array}
                  onDelete={handleDelete}
                  openScene={openScene}
                  selectedSceneId={selectedSceneId}
              />
          ))}
        </Table.Tbody>
      </Table>
  );
};
