import { Group, Button } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { InlineEdit } from "@/components/shared/InlineEdit/InlineEdit";

export const SceneHeader = ({
                              scene,
                              onBack,
                              onTitleChange
                            }: {
  scene: { title: string };
  onBack: () => void;
  onTitleChange: (title: string) => void;
}) => (
    <Group p={10} justify="space-between" align="center" direction="row" wrap="wrap">
      <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={onBack}
          mb="sm"
          p={0}
      >
        Назад к списку
      </Button>
      <InlineEdit
          value={scene.title}
          onChange={onTitleChange}
          label=""
      />
    </Group>
);
