// SceneLayout.tsx
import { useMedia } from "@/providers/MediaQueryProvider/MediaQueryProvider";
import {useLocation, useNavigate} from "react-router-dom";
import {Box, LoadingOverlay, ActionIcon} from "@mantine/core";
import {SceneEditor} from "@/components/scenes/SceneEditor/SceneEditor";
import {SceneManager} from "@/components/scenes/SceneManager/SceneManager";
import React, {useEffect, useState} from "react";
import type { IChapter } from "@/entities/BookEntities";
import {useSceneLayout} from "@/components/scenes/SceneLayout/hooks/useSceneLayout";
import {
  IconChevronRight,
} from "@tabler/icons-react";
import {useLiveQuery} from "dexie-react-hooks";
import {useBookStore} from "@/stores/bookStore/bookStore";
import {useUiSettingsStore} from "@/stores/uiSettingsStore/uiSettingsStore";

export const SceneLayout = () => {
  const { isMobile } = useMedia();
  const navigate = useNavigate();
  const [sceneId, setSceneId] = useState<number | undefined>();
  const [chapter, setChapter] = useState<IChapter | undefined>();
  const { sceneLayoutMode, setSceneLayoutMode } = useUiSettingsStore();
  const { selectedBook } = useBookStore();
  const chapterOnlyMode = selectedBook?.chapterOnlyMode === 1;
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const {scenes, chapters, getScenesWithBlockInstances} = useSceneLayout()

  // Добавляем к сценам привязки к экземплярам блоков
  const scenesWithBlockInstances = useLiveQuery(() =>
          getScenesWithBlockInstances(scenes),
      [scenes]
  );

  useEffect(() => {
    const isLoading = !scenes || !scenesWithBlockInstances || !chapters
    setIsLoading(isLoading)
  }, [scenes, scenesWithBlockInstances, chapters])



  const openScene = (sceneId: number, chapterParam?: IChapter) => {
    if (isMobile) {
      navigate(`/scene/card?id=${sceneId}`);
    } else {
        if (sceneLayoutMode === 'manager') {
            navigate(`/scene/card?id=${sceneId}`);
        }
        else{
            setSceneId(sceneId);
            setChapter(chapterParam);
        }
    }
  };

  const toggleMode = () => {
     setSceneLayoutMode(sceneLayoutMode === 'manager' ? 'split' : 'manager');
  };

  if (isMobile) {
    return <SceneManager
            openScene={openScene}
            mode="manager"
            scenes={scenesWithBlockInstances}
            chapters={chapters}
            chapterOnly={chapterOnlyMode}
        />;
  }

  if (sceneLayoutMode === 'manager') {
    return (
        <Box pos="relative">
          <SceneManager
              openScene={openScene}
              selectedSceneId={sceneId}
              mode={sceneLayoutMode}
              onToggleMode={toggleMode}
              scenes={scenesWithBlockInstances}
              chapters={chapters}
              chapterOnly={chapterOnlyMode}
          />
        </Box>
    );
  }

  return (
      <Box display="flex">
        <LoadingOverlay
            visible={isLoading}
            zIndex={1000}
            overlayProps={{ radius: 'sm', blur: 2 }}
            loaderProps={{ color: 'blue', type: 'bars' }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0}}
        />
        <Box style={{
          width: "500px",
          flexShrink: 0,
          position: 'relative',
          flex: 'auto',
          flexGrow: '0',
        }}>
          <Box style={{
            maxHeight: "calc(100vh - 50px)",
            overflowY: "auto",
          }}>
            <SceneManager
                openScene={openScene}
                selectedSceneId={sceneId}
                mode={sceneLayoutMode}
                onToggleMode={toggleMode}
                scenes={scenesWithBlockInstances}
                chapters={chapters}
                chapterOnly={chapterOnlyMode}
            />
          </Box>
        </Box>
        <Box  style={{
          overflowY: "auto",
          display: 'flex',
         }}>
          <ActionIcon
              onClick={toggleMode}
              variant="transparent"
              style={{
                position: 'fixed',
                top: 20,
                transform: 'none', // Убираем вертикальное выравнивание
                color: '#999', // Цвет иконки
                backgroundColor: '#fff', // Цвет фона
                borderBottomRightRadius: '4px', // Радиус нижнего правого угла
                borderTopRightRadius: '4px', // Радиус верхнего правого угла
              }}
          >
            <IconChevronRight
                size={30}
                strokeWidth={1}
            />
          </ActionIcon>
        </Box>
        <Box style={{
          flexGrow: 1,
          flex: 'auto',
          display: "flex",
          justifyContent: "center",
        }}>
          {sceneId ? <SceneEditor sceneId={sceneId} chapter={chapter} /> : <Placeholder />}
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
