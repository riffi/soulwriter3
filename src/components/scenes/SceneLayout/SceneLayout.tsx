// SceneLayout.tsx
import { useMedia } from "@/providers/MediaQueryProvider/MediaQueryProvider";
import {useLocation, useNavigate} from "react-router-dom";
import {Box, LoadingOverlay} from "@mantine/core";
import {SceneEditor} from "@/components/scenes/SceneEditor/SceneEditor";
import {SceneManager} from "@/components/scenes/SceneManager/SceneManager";
import React, {useState} from "react";
import {useSceneLayout} from "@/components/scenes/SceneLayout/hooks/useSceneLayout";

export const SceneLayout = () => {
  const { isMobile } = useMedia();
  const navigate = useNavigate();
  const [sceneId, setSceneId] = useState<number | undefined>();
  const [mode, setMode] = useState<'manager' | 'split'>('split');
  const {scenes, chapters} = useSceneLayout()
  const loading = !scenes || !chapters

  const openScene = (sceneId: number) => {
    if (isMobile) {
      navigate(`/scene/card?id=${sceneId}`);
    } else {
      setSceneId(sceneId);
      setMode('split');
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === 'manager' ? 'split' : 'manager');
  };

  if (isMobile) {
    return sceneId ? <SceneEditor sceneId={sceneId} /> :
        <SceneManager
          openScene={openScene}
          mode="manager"
          scenes={scenes}
          chapters={chapters}
        />;
  }

  if (mode === 'manager') {
    return (
        <Box>
          <SceneManager
              openScene={openScene}
              selectedSceneId={sceneId}
              mode={mode}
              onToggleMode={toggleMode}
              scenes={scenes}
              chapters={chapters}
          />
        </Box>
    );
  }

  return (
      <Box display="flex">
        <LoadingOverlay
            visible={loading}
            zIndex={1000}
            overlayProps={{ radius: 'sm', blur: 2 }}
            loaderProps={{ color: 'blue', type: 'bars' }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0}}
        />
        <Box style={{
          width: "500px",
          flexShrink: 0,
        }}>
          <Box style={{
            maxHeight: "calc(100vh - 50px)",
            position: "fixed",
            overflowY: "auto",
          }}>
            <SceneManager
                openScene={openScene}
                selectedSceneId={sceneId}
                mode={mode}
                onToggleMode={toggleMode}
                scenes={scenes}
                chapters={chapters}
            />
          </Box>
        </Box>
        <Box style={{ flexGrow: 1 }}>
          {sceneId ? <SceneEditor sceneId={sceneId} /> : <Placeholder />}
        </Box>
      </Box>
  );
};

const Placeholder = () => (
    <Box
        display="flex"
        style={{
          height: "100dvh",
          alignItems: "center",
          justifyContent: "center",
          color: "#999",
        }}
    >
      Выберите сцену для редактирования
    </Box>
);
