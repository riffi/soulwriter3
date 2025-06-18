import { SceneLayout } from "@/components/scenes/SceneLayout/SceneLayout";
import { Switch, Box } from "@mantine/core";
import { useUiSettingsStore } from "@/stores/uiSettingsStore/uiSettingsStore";


export const ScenesPage = () => {
  const { chapterOnlyMode, setChapterOnlyMode } = useUiSettingsStore();

  return (
      <Box p="md">
        <Switch
            label="Только главы"
            checked={chapterOnlyMode}
            onChange={(e) => setChapterOnlyMode(e.currentTarget.checked)}
            mb="md"
        />
        <SceneLayout />
      </Box>
  );
};
