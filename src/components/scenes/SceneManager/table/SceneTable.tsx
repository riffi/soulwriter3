import { Table, Text, Paper, Center, Group } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useScenes } from "../useScenes";
import { useChapters } from "../useChapters";
import { ChapterRow } from "./ChapterRow";
import { SceneRow } from "./SceneRow";

interface SceneTableProps {
  openCreateModal: (chapterId: number) => void;
}

export const SceneTable = ({ openCreateModal }: SceneTableProps) => {
  const { scenes } = useScenes();
  const { chapters } = useChapters();

  const getScenesForChapter = (chapterId: number | null) => {
    return scenes?.filter(scene =>
        chapterId ? scene.chapterId === chapterId : scene.chapterId === undefined
    ) || [];
  };

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
      <Table horizontalSpacing="sm" verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Название</Table.Th>
            <Table.Th w={150}>Действия</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {getScenesForChapter(null).map((scene) => (
              <SceneRow key={`scene-${scene.id}`} scene={scene} />
          ))}

          {chapters?.map((chapter) => (
              <ChapterRow
                  key={`chapter-${chapter.id}`}
                  chapter={chapter}
                  scenes={getScenesForChapter(chapter.id)}
                  onAddScene={() => openCreateModal(chapter.id)}
              />
          ))}
        </Table.Tbody>
      </Table>
  );
};
