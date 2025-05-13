import { Box, Container, Flex } from "@mantine/core";
import { RichEditor } from "@/components/shared/RichEditor/RichEditor";
import { WarningsPanel } from "@/components/scenes/SceneEditor/parts/WarningsPanel/WarningsPanel";
import { SceneStatusPanel } from "@/components/scenes/SceneEditor/parts/SceneStatusPanel";
import type { IWarningGroup } from "@/components/shared/RichEditor/types";
import {IScene} from "@/entities/BookEntities";
import {useEffect} from "react";
import {InlineEdit} from "@/components/shared/InlineEdit/InlineEdit";
import {usePageTitle} from "@/providers/PageTitleProvider/PageTitleProvider";
import {useKeyboardHeight} from "@/components/scenes/SceneEditor/hooks/useKeyboardHeight";
interface SceneMobileContentProps {
  sceneBody: string;
  handleContentChange: (contentHTML: string, contentText: string) => void;
  warningGroups: IWarningGroup[];
  setWarningGroups: (warningGroups: IWarningGroup[]) => void;
  selectedGroup?: IWarningGroup;
  setSelectedGroup: (group?: IWarningGroup) => void;
  scene: IScene;
  saveScene: (dataToSave: IScene, silent: boolean) => void;
}

export const SceneMobileContent = ({
                                     sceneBody,
                                     handleContentChange,
                                     warningGroups,
                                     setWarningGroups,
                                     selectedGroup,
                                     setSelectedGroup,
                                     scene,
                                     saveScene
                                   }: SceneMobileContentProps) => {
  const { setPageTitle, setTitleElement } = usePageTitle();

  const keyboardHeight = useKeyboardHeight(true);

  // Управление заголовком через эффект
  useEffect(() => {
    if (scene) {
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
  }, [scene]); // Зависимости эффекта

  return (
      <Container size="xl" p="0" fluid>
        <RichEditor
            initialContent={sceneBody}
            onContentChange={handleContentChange}
            onWarningsChange={setWarningGroups}
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
            mobileConstraints={{
              top: 50,
              bottom: warningGroups?.length > 0 ? 100 : 30
            }}
        />
        <Flex
            justify="stretch"
            align="stretch"
            direction="column"
            wrap="wrap"
            style={{ height: 'calc(100dvh - 50px)' }}
        >
          {warningGroups.length > 0 && (
              <Box flex="auto">
                <Box style={{
                  position: 'absolute',
                  bottom: keyboardHeight > 0 ? -1000 : 0,
                  height: '100px',
                  left: 0,
                  right: 0,
                  zIndex: 200,
                  transition: 'bottom 0.3s ease',
                  padding: '8px',
                  backgroundColor: 'white',
                  boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
                }}>
                  <WarningsPanel
                      warningGroups={warningGroups}
                      onSelectGroup={setSelectedGroup}
                      selectedGroup={selectedGroup}
                      displayType="iteration"
                  />
                </Box>
              </Box>
          )}
          <Box flex={2}>
            <SceneStatusPanel scene={scene} />
          </Box>
        </Flex>
      </Container>
  )
}

