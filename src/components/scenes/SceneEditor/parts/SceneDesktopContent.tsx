import {Box, Button, Container, Flex, Group, Paper, Text} from "@mantine/core";
import { RichEditor } from "@/components/shared/RichEditor/RichEditor";
import { WarningsPanel } from "@/components/scenes/SceneEditor/parts/WarningsPanel/WarningsPanel";
import { SceneStatusPanel } from "@/components/scenes/SceneEditor/parts/SceneStatusPanel";
import type { IWarningGroup } from "@/components/shared/RichEditor/types";
import {IScene} from "@/entities/BookEntities";
import {useHeaderVisibility} from "@/components/scenes/SceneEditor/hooks/useHeaderVisibility";
import {IconArrowLeft, IconLink, IconEdit, IconEye} from "@tabler/icons-react";
import {InlineEdit} from "@/components/shared/InlineEdit/InlineEdit";
import {SceneLinkManager} from "@/components/scenes/SceneEditor/parts/SceneLinkManager";
import {useDisclosure} from "@mantine/hooks";
import {useState} from "react";

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
  const [readOnly, setReadOnly] = useState(true);

  return (
    <Container size="xl" p="0" fluid >
      <Flex gap="md" justify="space-between" align="flex-start" wrap="wrap">
        <Box flex={10}>
          <Container
              size="xl"
              p="0"

          >
            <Paper
                withBorder
                p="lg"
                radius="md"
                shadow="sm"
                style={{
                  maxWidth: '900px',
                  flex: 1,
                }}
            >
                <>
                {isHeaderVisible && (
                    <Group p={10} justify="space-between" align="center" direction="row" wrap="wrap">
                      <Group>
                        <InlineEdit
                            value={scene.title}
                            textProps={{
                              style: { fontSize: '1.5rem' }
                            }}
                            onChange={(title) => saveScene({ ...scene, title })}
                            label=""
                        />
                        <Group>
                          <Button
                              variant="outline"
                              onClick={openLinkManager}
                              leftSection={<IconLink size={16} />}
                          >
                            Связи
                          </Button>
                          <Button
                              variant={"outline"}
                              onClick={() => setReadOnly(!readOnly)}
                              active={!readOnly}
                              leftSection={
                                <>
                                  {!readOnly ? <IconEye size={16} /> :
                                  <IconEdit size={16} />}
                                </>
                              }
                          >
                            {readOnly && 'Редактирование'}
                            {!readOnly && 'Просмотр'}
                          </Button>
                        </Group>
                      </Group>
                    </Group>
                )}
                </>
              { !readOnly &&
                <RichEditor
                    initialContent={sceneBody}
                    onContentChange={handleContentChange}
                    onWarningsChange={setWarningGroups}
                    selectedGroup={selectedGroup}
                    setSelectedGroup={setSelectedGroup}
                    onScroll={handleEditorScroll}
                />
              }
              <>
              {readOnly && (
                  <div>
                    {sceneBody !== '' && <div
                        style={{
                          textIndent: '1rem',
                        }}
                        dangerouslySetInnerHTML={{ __html: sceneBody }}>
                    </div>
                    }
                    {sceneBody === '' && <div
                        style={{
                          textIndent: '1rem',
                        }}
                        >
                      <Text
                          color="dimmed"
                          onClick={() => setReadOnly(!readOnly)}
                      >
                        Нет текста
                      </Text>
                    </div>
                    }
                  </div>
              )}
              </>
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

