import { useCallback, useEffect, useState } from "react";
import { Box, Container, Flex } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useMedia } from "@/providers/MediaQueryProvider/MediaQueryProvider";
import { usePageTitle } from "@/providers/PageTitleProvider/PageTitleProvider";
import { useSceneEditor } from "@/components/scenes/SceneEditor/useSceneEditor";
import { RichEditor } from "@/components/shared/RichEditor/RichEditor";
import { WarningsPanel } from "@/components/scenes/SceneEditor/parts/WarningsPanel/WarningsPanel";
import { SceneStatusPanel } from "@/components/scenes/SceneEditor/parts/SceneStatusPanel";
import { useKeyboardHeight } from "./hooks/useKeyboardHeight";
import { useHeaderVisibility } from "./hooks/useHeaderVisibility";
import { SceneHeader } from "./parts/SceneHeader";
import { MobilePanel } from "./parts/MobilePanel";
import { DesktopPanel } from "./parts/DesktopPanel";
import type { SceneEditorProps } from "./types";
import {IWarningGroup} from "@/components/shared/RichEditor/types";
import {InlineEdit} from "@/components/shared/InlineEdit/InlineEdit";

export const SceneEditor = ({ sceneId }: SceneEditorProps) => {
  const navigate = useNavigate();
  const { isMobile } = useMedia();
  const { setPageTitle, setTitleElement } = usePageTitle();
  const { scene, saveScene } = useSceneEditor(sceneId ? Number(sceneId) : undefined);

  const [selectedGroup, setSelectedGroup] = useState<IWarningGroup>();
  const [sceneBody, setSceneBody] = useState("");
  const [warningGroups, setWarningGroups] = useState<IWarningGroup[]>([]);

  const keyboardHeight = useKeyboardHeight(isMobile);
  const { isHeaderVisible, handleEditorScroll } = useHeaderVisibility();
  //useSceneTitle(scene, setPageTitle);

// Управление заголовком через эффект
  useEffect(() => {
    if (scene && isMobile) {
      const headerElement = (
          <Box style={{ width: '80%' }}>
            <InlineEdit
                value={scene.title}
                onChange={(title) => saveScene({ ...scene, title })}
                label=""
            />
          </Box>
      );
      setTitleElement(headerElement);
    } else {
      setTitleElement(null);
    }

    return () => {
      setTitleElement(null); // Очистка при размонтировании
    };
  }, [scene, isMobile]); // Зависимости эффекта

  // Обработчик изменения контента в редакторе
  const handleContentChange = useCallback(
  (contentHTML, contentText) => {
    if (!scene?.id || contentHTML === scene.body) return;

    const updatedScene = {
      ...scene,
      body: contentHTML,
      totalSymbolCountWithSpaces: contentText.length,
      totalSymbolCountWoSpaces: contentText.replace(/\s+/g, '').length
    };

    saveScene(updatedScene, true);
    setSceneBody(contentHTML);
  },
  [scene, saveScene]
);


  // Обновление состояния редактора при изменении текста сцены
  useEffect(() => {
    if (scene?.body && scene.body !== sceneBody) {
      setSceneBody(scene.body);
    }
  }, [scene?.body]);

  if (!scene?.id) return null;

  const mobileContent = (
        <>
          <Container size="xl" p="0" fluid  >
            <Flex
                justify="stretch"
                align="stretch"
                direction="column"
                wrap="wrap"
                style={{ height: 'calc(100dvh - 50px)' }}
            >

              <Box flex={1}>
                  <RichEditor
                      initialContent={sceneBody}
                      onContentChange={handleContentChange}
                      onWarningsChange={setWarningGroups}
                      selectedGroup={selectedGroup}
                      setSelectedGroup={setSelectedGroup}
                      onScroll={handleEditorScroll}
                      mobileConstraints={{
                        top: 50,
                        bottom: warningGroups?.length > 0 ? 100 : 30
                      }}
                  />
              </Box>
              <>
                {warningGroups.length > 0 && (
                    <Box
                        flex={'auto'}
                    >
                        <MobilePanel keyboardHeight={keyboardHeight}>
                          <WarningsPanel
                              warningGroups={warningGroups}
                              onSelectGroup={setSelectedGroup}
                              selectedGroup={selectedGroup}
                              displayType="iteration"
                          />
                        </MobilePanel>

                    </Box>
                )}
              </>
              <Box flex={2}>
                <SceneStatusPanel scene={scene} />
              </Box>
            </Flex>
          </Container>
      </>
  )

  const desktopContent = (
      <>
        <Container size="xl" p="0" fluid style={{ height: 'calc(100vh-200px)' }}>
          <Flex gap="md" justify="space-between" align="flex-start" wrap="wrap">
            <Box flex={10}>
              <Container size="xl" p="0"  style={{ height: 'calc(100vh-200px)' }}>
                <DesktopPanel>
                  <>
                    {isHeaderVisible && <SceneHeader
                        scene={scene}
                        onBack={() => navigate('/scenes')}
                        onTitleChange={(title) => saveScene({ ...scene, title })}
                    />}

                    <RichEditor
                        initialContent={sceneBody}
                        onContentChange={handleContentChange}
                        onWarningsChange={setWarningGroups}
                        selectedGroup={selectedGroup}
                        setSelectedGroup={setSelectedGroup}
                        onScroll={handleEditorScroll}
                    />
                    <SceneStatusPanel scene={scene} />
                  </>
                </DesktopPanel>
              </Container>
            </Box>
            <>
              {warningGroups.length > 0 && (
                  <Box
                      flex={2}
                      style={{ position: 'sticky', top: 16 }}
                  >
                      <WarningsPanel
                          warningGroups={warningGroups}
                          onSelectGroup={setSelectedGroup}
                          selectedGroup={selectedGroup}
                          displayType="iteration"
                      />
                  </Box>
              )}
            </>
          </Flex>
        </Container>
      </>
  )

  return (
      <>
        {isMobile ? mobileContent : desktopContent}
      </>
  );
};
