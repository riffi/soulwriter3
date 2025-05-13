import {Box, Button, Container, Flex, Group, Paper} from "@mantine/core";
import { RichEditor } from "@/components/shared/RichEditor/RichEditor";
import { WarningsPanel } from "@/components/scenes/SceneEditor/parts/WarningsPanel/WarningsPanel";
import { SceneStatusPanel } from "@/components/scenes/SceneEditor/parts/SceneStatusPanel";
import type { IWarningGroup } from "@/components/shared/RichEditor/types";
import {IScene} from "@/entities/BookEntities";
import {useHeaderVisibility} from "@/components/scenes/SceneEditor/hooks/useHeaderVisibility";
import {IconArrowLeft, IconLink} from "@tabler/icons-react";
import {InlineEdit} from "@/components/shared/InlineEdit/InlineEdit";
import {SceneLinkManager} from "@/components/scenes/SceneEditor/parts/SceneLinkManager";
import {useDisclosure} from "@mantine/hooks";

interface SceneDesktopContentProps {
  scene: IScene;
  navigate: (path: string) => void;
  saveScene: (scene: any) => void; // Замените на ваш тип
  sceneBody: string;
  handleContentChange: (contentHTML: string, contentText: string) => void;
  warningGroups: IWarningGroup[];
  setWarningGroups: (warningGroups: IWarningGroup[]) => void;
  selectedGroup?: IWarningGroup;
  setSelectedGroup: (group?: IWarningGroup) => void;
}

export const SceneDesktopContent = ({
                                      scene,
                                      navigate,
                                      saveScene,
                                      sceneBody,
                                      handleContentChange,
                                      warningGroups,
                                      setWarningGroups,
                                      selectedGroup,
                                      setSelectedGroup,
                                    }: SceneDesktopContentProps) => {

  const { isHeaderVisible, handleEditorScroll } = useHeaderVisibility();
  const [linkManagerOpened, { open: openLinkManager, close: closeLinkManager }] = useDisclosure(false);

  return (
    <Container size="xl" p="0" fluid style={{ height: 'calc(100vh-200px)' }}>
      <Flex gap="md" justify="space-between" align="flex-start" wrap="wrap">
        <Box flex={10}>
          <Container size="xl" p="0" style={{ height: 'calc(100vh-200px)' }}>
            <Paper withBorder p="lg" radius="md" shadow="sm">
                <>
                {isHeaderVisible && (
                    <Group p={10} justify="space-between" align="center" direction="row" wrap="wrap">
                      <Button
                          variant="subtle"
                          leftSection={<IconArrowLeft size={16} />}
                          onClick={() => navigate('/scenes')}
                          mb="sm"
                          p={0}
                      >
                        Назад к списку
                      </Button>
                      <Group>
                        <InlineEdit
                            value={scene.title}
                            onChange={(title) => saveScene({ ...scene, title })}
                            label=""
                        />
                        <Button
                            variant="outline"
                            onClick={openLinkManager}
                            leftSection={<IconLink size={16} />}
                        >
                          Связи
                        </Button>
                      </Group>
                    </Group>
                )}
                </>
                <RichEditor
                    initialContent={sceneBody}
                    onContentChange={handleContentChange}
                    onWarningsChange={setWarningGroups}
                    selectedGroup={selectedGroup}
                    setSelectedGroup={setSelectedGroup}
                    onScroll={handleEditorScroll}
                />
                <SceneStatusPanel scene={scene} />
            </Paper>
          </Container>
        </Box>
        <>
        {warningGroups.length > 0 && (
            <Box flex={2} style={{ position: 'sticky', top: 16 }}>
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
      <SceneLinkManager
          sceneId={scene.id!}
          opened={linkManagerOpened}
          onClose={closeLinkManager}
      />
    </Container>
)}

