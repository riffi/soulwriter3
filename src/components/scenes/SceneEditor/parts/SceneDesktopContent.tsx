import {ActionIcon, Box, Button, Container, Flex, Group, Paper, Text} from "@mantine/core";
import { RichEditor } from "@/components/shared/RichEditor/RichEditor";
import { WarningsPanel } from "@/components/scenes/SceneEditor/parts/WarningsPanel/WarningsPanel";
import { SceneStatusPanel } from "@/components/scenes/SceneEditor/parts/SceneStatusPanel";
import type { IWarningGroup } from "@/components/shared/RichEditor/types";
import {IChapter, IScene} from "@/entities/BookEntities";
import {useHeaderVisibility} from "@/components/scenes/SceneEditor/hooks/useHeaderVisibility";
import {IconArrowLeft, IconLink, IconEdit, IconEye, IconArrowUp} from "@tabler/icons-react";
import {InlineEdit} from "@/components/shared/InlineEdit/InlineEdit";
import {SceneLinkManager} from "@/components/scenes/SceneEditor/parts/SceneLinkManager/SceneLinkManager";
import {useDisclosure, useWindowScroll} from "@mantine/hooks";
import {useEffect, useState} from "react";
import {InlineEdit2} from "@/components/shared/InlineEdit2/InlineEdit2";

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
    focusMode: boolean;
    toggleFocusMode: () => void;
    openKnowledgeBaseDrawer: () => void;
    openAnalysisDrawer: () => void;
    chapter?: IChapter;
    onChapterTitleChange?: (title: string) => void;
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
                                        focusMode,
                                        toggleFocusMode,
                                        openKnowledgeBaseDrawer,
                                        openAnalysisDrawer,
                                        chapter,
                                        onChapterTitleChange,
                                    }: SceneDesktopContentProps) => {

    const { isHeaderVisible, handleEditorScroll } = useHeaderVisibility();
    const [linkManagerOpened, { open: openLinkManager, close: closeLinkManager }] = useDisclosure(false);
    const [readOnly, setReadOnly] = useState(true);
    const [scroll, scrollTo] = useWindowScroll();
    const [showScrollButton, setShowScrollButton] = useState(false);

    useEffect(() => {
        const showButton = scroll.y > 300;
        setShowScrollButton(showButton);
    }, [scroll.y]);

    const scrollToTop = () => {
        scrollTo({ y: 0, x: 0 });
    };

    return (
        <Container p="0" fluid style={focusMode ? { paddingTop: '1rem', paddingBottom: '1rem' } : {}}>
            <Flex gap="md" justify="space-between" align="flex-start" wrap="wrap">
                <Box flex={focusMode ? 12 : 10} style={focusMode ? { width: '100%' } : {}}>
                    <Container
                        p="0"
                        style={focusMode ? { maxWidth: '100%' } : {}}
                    >
                        <Paper
                            withBorder={!focusMode}
                            p="lg"
                            radius="md"
                            shadow="sm"
                            style={{
                                maxWidth: focusMode ? '900px' : '900px',
                                height: focusMode ? 'calc(100vh - 2rem)' : 'calc(100vh - 65px)',
                                overflowY: 'auto',
                                flex: 1,
                                margin: focusMode ? '0 auto' : undefined,
                            }}
                        >
                            <>
                                {isHeaderVisible && !focusMode && (
                                    <Group p={10} justify="space-between" align="center" w="100%">
                                        <Box flex={1}>
                                            <InlineEdit2
                                                value={chapter ? chapter.title : scene.title}
                                                size={"xl"}
                                                onChange={(title) => {
                                                    if (chapter && onChapterTitleChange) {
                                                        onChapterTitleChange(title);
                                                    } else {
                                                        saveScene({ ...scene, title });
                                                    }
                                                }}
                                            />
                                        </Box>

                                        <Group  gap="sm">
                                            <Button
                                                variant="outline"
                                                onClick={openLinkManager}
                                                leftSection={<IconLink size={16} />}
                                            >
                                                Связи
                                            </Button>
                                            {/* New Button for Knowledge Base */}
                                            <Button
                                                variant="outline"
                                                onClick={openKnowledgeBaseDrawer}
                                                // leftSection={<IconDatabasePlus size={16} />} // Optional: Add an icon
                                            >
                                                Наполнить базу знаний
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={openAnalysisDrawer}
                                            >
                                                Анализ
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
                                )}
                            </>
                            { (!readOnly || focusMode) && // Always show RichEditor in focusMode if not readOnly
                                <RichEditor
                                    initialContent={sceneBody}
                                    onContentChange={handleContentChange}
                                    onWarningsChange={setWarningGroups}
                                    selectedGroup={selectedGroup}
                                    setSelectedGroup={setSelectedGroup}
                                    onScroll={handleEditorScroll}
                                    desktopConstraints={{
                                        top: '-20px',
                                        bottom: '0',
                                    }}
                                    focusMode={focusMode}
                                    toggleFocusMode={toggleFocusMode}
                                />
                            }
                            <>
                                {readOnly && !focusMode && ( // Hide readOnly view in focusMode
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
                        </Paper>
                        {!focusMode && <SceneStatusPanel scene={scene} />}
                    </Container>
                </Box>
                <>
                    {warningGroups.length > 0 && !focusMode && (
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
            {!focusMode && <SceneLinkManager
                sceneId={scene.id!}
                opened={linkManagerOpened}
                onClose={closeLinkManager}
            />}
            {showScrollButton && !focusMode && (
                <ActionIcon
                    onClick={scrollToTop}
                    variant="filled"
                    color="blue"
                    radius="xl"
                    size="xl"
                    aria-label="Scroll to top"
                    style={{
                        position: 'fixed',
                        bottom: 40,
                        right: 20,
                        opacity: 0.5,
                        transition: 'opacity 0.3s ease-in-out',
                        ':hover': {
                            opacity: 1,
                            backgroundColor: '#1e73be',
                        }
                    }}
                >
                    <IconArrowUp size={20} />
                </ActionIcon>
            )}
        </Container>
    )}

