import { useCallback, useEffect, useState } from "react";
import { Box, Container, Flex, Space } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useMedia } from "@/providers/MediaQueryProvider/MediaQueryProvider";
import { usePageTitle } from "@/providers/PageTitleProvider/PageTitleProvider";
import { useSceneEditor } from "@/components/scenes/SceneEditor/useSceneEditor";
import { RichEditor } from "@/components/shared/RichEditor/RichEditor";
import { WarningsPanel } from "@/components/scenes/SceneEditor/parts/WarningsPanel/WarningsPanel";
import { SceneStatusPanel } from "@/components/scenes/SceneEditor/parts/SceneStatusPanel";
import { useKeyboardHeight } from "./hooks/useKeyboardHeight";
import { useSceneTitle } from "./hooks/useSceneTitle";
import { useHeaderVisibility } from "./hooks/useHeaderVisibility";
import { SceneHeader } from "./parts/SceneHeader";
import { MobilePanel } from "./parts/MobilePanel";
import { DesktopPanel } from "./parts/DesktopPanel";
import type { SceneEditorProps } from "./types";
import {IWarningGroup} from "@/components/shared/RichEditor/types";

export const SceneEditor = ({ sceneId }: SceneEditorProps) => {
  const navigate = useNavigate();
  const { isMobile } = useMedia();
  const { setPageTitle } = usePageTitle();
  const { scene, saveScene } = useSceneEditor(sceneId ? Number(sceneId) : undefined);

  const [selectedGroup, setSelectedGroup] = useState<IWarningGroup>();
  const [sceneBody, setSceneBody] = useState("");
  const [warningGroups, setWarningGroups] = useState<IWarningGroup[]>([]);

  const keyboardHeight = useKeyboardHeight(isMobile);
  const { isHeaderVisible, handleEditorScroll } = useHeaderVisibility();
  useSceneTitle(scene, setPageTitle);

  const handleContentChange = useCallback(
      (contentHTML: string, contentText: string) => {
        if (!scene?.id || contentHTML === scene.body) return;

        saveScene({
          ...scene,
          body: contentHTML,
          totalSymbolCountWithSpaces: contentText.length,
          totalSymbolCountWoSpaces: contentText.replace(/\s+/g, '').length
        }, true);

        setSceneBody(contentHTML);
      },
      [scene, saveScene]
  );

  useEffect(() => {
    if (scene?.body && scene.body !== sceneBody) {
      setSceneBody(scene.body);
    }
  }, [scene?.body]);

  if (!scene?.id) return null;

  const content = (
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
            onScroll={handleEditorScroll}
        />
        <SceneStatusPanel scene={scene} />
      </>
  );

  return (
      <>
        <Container size="xl" p="0" fluid style={{ height: 'calc(100vh-200px)' }}>
          <Flex gap="md" justify="space-between" align="flex-start" wrap="wrap">
            <Box flex={isMobile? 'auto' : 10}>
              <Container size="xl" p="0">
                {isMobile ? content : <DesktopPanel>{content}</DesktopPanel>}
              </Container>
            </Box>
            <>
            {warningGroups.length > 0 && (
                <Box
                    flex={2}
                    style={isMobile ? undefined : { position: 'sticky', top: 16 }}
                >
                  <>
                  {isMobile ? (
                      <MobilePanel keyboardHeight={keyboardHeight}>
                        <WarningsPanel
                            warningGroups={warningGroups}
                            onSelectGroup={setSelectedGroup}
                            selectedGroup={selectedGroup}
                            displayType="iteration"
                        />
                      </MobilePanel>
                  ) : (
                      <WarningsPanel
                          warningGroups={warningGroups}
                          onSelectGroup={setSelectedGroup}
                          selectedGroup={selectedGroup}
                          displayType="iteration"
                      />
                  )}
                  </>
                </Box>
            )}
            </>
          </Flex>
        </Container>


      </>
  );
};
