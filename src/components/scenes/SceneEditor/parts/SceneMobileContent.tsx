import {ActionIcon, Box, Button, Container, Flex, Group} from "@mantine/core";
import { RichEditor } from "@/components/shared/RichEditor/RichEditor";
import { WarningsPanel } from "@/components/scenes/SceneEditor/parts/WarningsPanel/WarningsPanel";
import { SceneStatusPanel } from "@/components/scenes/SceneEditor/parts/SceneStatusPanel";
import type { IWarningGroup } from "@/components/shared/RichEditor/types";
import {IChapter, IScene} from "@/entities/BookEntities";
import {useEffect} from "react";
import {InlineEdit} from "@/components/shared/InlineEdit/InlineEdit";
import {usePageTitle} from "@/providers/PageTitleProvider/PageTitleProvider";
import {useKeyboardHeight} from "@/components/scenes/SceneEditor/hooks/useKeyboardHeight";
import {SceneLinkManager} from "@/components/scenes/SceneEditor/parts/SceneLinkManager/SceneLinkManager";
import {useDisclosure} from "@mantine/hooks";
import {IconDatabaseSmile, IconLink, IconReportAnalytics} from "@tabler/icons-react";
import {InlineEdit2} from "@/components/shared/InlineEdit2/InlineEdit2";
interface SceneMobileContentProps {
    sceneBody: string;
    handleContentChange: (contentHTML: string, contentText: string) => void;
    warningGroups: IWarningGroup[];
    setWarningGroups: (warningGroups: IWarningGroup[]) => void;
    selectedGroup?: IWarningGroup;
    setSelectedGroup: (group?: IWarningGroup) => void;
    scene: IScene;
    saveScene: (dataToSave: IScene, silent: boolean) => void;
    focusMode: boolean;
    toggleFocusMode: () => void;
    openKnowledgeBaseDrawer: () => void;
    openAnalysisDrawer: () => void;
    chapter?: IChapter;
    onChapterTitleChange?: (title: string) => void;
}

export const SceneMobileContent = ({
                                       sceneBody,
                                       handleContentChange,
                                       warningGroups,
                                       setWarningGroups,
                                       selectedGroup,
                                       setSelectedGroup,
                                       scene,
                                       saveScene,
                                       focusMode,
                                       toggleFocusMode,
                                       openKnowledgeBaseDrawer,
                                       openAnalysisDrawer,
                                       chapter,
                                       onChapterTitleChange
                                   }: SceneMobileContentProps) => {
    const { setPageTitle, setTitleElement } = usePageTitle();
    const [linkManagerOpened, { open: openLinkManager, close: closeLinkManager }] = useDisclosure(false);
    const keyboardHeight = useKeyboardHeight(true);

    // Управление заголовком через эффект
    useEffect(() => {
        if (focusMode) {
            setTitleElement(null);
            return;
        }
        if (scene) {
            const headerElement = (
                <Group display="flex" align="center" style={{flexGrow:1, paddingLeft:"10px"}} >
                    <Box flex={1} flexGrow={1}>
                        <InlineEdit2
                            value={chapter ? chapter.title : scene.title}
                            onChange={(title) => {
                                if (chapter && onChapterTitleChange) {
                                    onChapterTitleChange(title);
                                } else {
                                    saveScene({ ...scene, title });
                                }
                            }}
                            label=""
                        />
                    </Box>
                    <ActionIcon
                        variant="outline"
                        onClick={openLinkManager}
                        style={{
                            display: 'flex',
                            flexGrow:0
                        }}
                    >
                        <IconLink size={16} />
                    </ActionIcon>
                    <ActionIcon
                        variant="outline"
                        onClick={openKnowledgeBaseDrawer}
                        style={{
                            display: 'flex',
                            flexGrow:0
                        }}
                    >

                        <IconDatabaseSmile size={16} />
                    </ActionIcon>
                    <ActionIcon
                        variant="outline"
                        onClick={openAnalysisDrawer}
                        style={{
                            display: 'flex',
                            flexGrow:0
                        }}
                    >
                        <IconReportAnalytics size={16} />
                    </ActionIcon>
                </Group>
            );
            setTitleElement(headerElement);
        } else {
            setTitleElement(null);
        }
        return () => {
            setTitleElement(null);
        };
    }, [scene, chapter, focusMode]);

    return (
        <Container size="xl" p="0" fluid style={focusMode ? { paddingTop: '1rem', paddingBottom: '1rem', height: '100dvh' } : {}}>
            <RichEditor
                initialContent={sceneBody}
                onContentChange={handleContentChange}
                onWarningsChange={setWarningGroups}
                selectedGroup={selectedGroup}
                setSelectedGroup={setSelectedGroup}
                mobileConstraints={focusMode ? { top: 0, bottom: 0 } : {
                    top: 50, // Standard top when not in focus mode
                    bottom: warningGroups?.length > 0 && !focusMode ? 100 : 30 // Standard bottom
                }}
                focusMode={focusMode}
                toggleFocusMode={toggleFocusMode}
            />
            {!focusMode && (
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
            )}
            {!focusMode && <SceneLinkManager
                sceneId={scene.id!}
                opened={linkManagerOpened}
                onClose={closeLinkManager}
            />}
        </Container>
    )
}

