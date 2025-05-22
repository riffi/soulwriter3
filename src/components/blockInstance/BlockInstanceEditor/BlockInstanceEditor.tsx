import {useNavigate} from "react-router-dom";
import {
  useBlockInstanceEditor
} from "@/components/blockInstance/BlockInstanceEditor/hooks/useBlockInstanceEditor";
import {
  ActionIcon,
  Box,
  Container,
  Group, ScrollArea,
  SegmentedControl,
  Text, Title, Button, Drawer, FileInput, Modal, Stack, Image as MantineImage
} from "@mantine/core";
import {IconArrowLeft, IconUpload, IconPhoto, IconTrash} from "@tabler/icons-react";
import classes from "./BlockInstanceEditor.module.css";
import React, {useEffect, useState, useCallback} from "react";

import {InlineEdit} from "@/components/shared/InlineEdit/InlineEdit";
import {
  InstanceRelationsEditor
} from "@/components/blockInstance/BlockInstanceEditor/parts/InstanceRelationsEditor/InstanceRelationsEditor";

import {
  ChildInstancesTable
} from "@/components/blockInstance/BlockInstanceEditor/parts/InstanceChildrenEditor/ChildInstancesTable";

import {
  InstanceParameterEditor
} from "@/components/blockInstance/BlockInstanceEditor/parts/InstanceParameterEditor/InstanceParameterEditor";
import {relationUtils} from "@/utils/relationUtils";
import {IconViewer} from "@/components/shared/IconViewer/IconViewer";
import {IBlockStructureKind, IBlockTabKind} from "@/entities/ConstructorEntities";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import {usePageTitle} from "@/providers/PageTitleProvider/PageTitleProvider";
import {
  ReferencedInstanceEditor
} from "@/components/blockInstance/BlockInstanceEditor/parts/ReferencedInstanceEditor/ReferencedInstanceEditor";
import {InlineEdit2} from "@/components/shared/InlineEdit2/InlineEdit2";
import {GameIconSelector} from "@/components/shared/GameIconSelector/GameIconSelector";
import {notifications} from "@mantine/notifications";
import Cropper from 'react-easy-crop';
import { Point, Area } from 'react-easy-crop/types';

export interface IBlockInstanceEditorProps {
  blockInstanceUuid: string;
}

// Утилита для создания canvas и изменения размера изображения
const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new window.Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', error => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
    targetSize: number = 128
): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Устанавливаем размер canvas
  canvas.width = targetSize;
  canvas.height = targetSize;

  // Рисуем обрезанное изображение, масштабируя его до нужного размера
  ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      targetSize,
      targetSize
  );

  return canvas.toDataURL('image/png');
};

export const BlockInstanceEditor = (props: IBlockInstanceEditorProps) => {
  // Состояния для вкладок и активной вкладки
  const [tabs, setTabs] = useState<Array<{ label: string; value: string }>>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const navigate = useNavigate();
  const {isMobile} = useMedia();
  const {setTitleElement} = usePageTitle()

  // Состояния для выбора иконок
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customIconModalOpen, setCustomIconModalOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    blockInstance,
    block,
    updateBlockInstanceTitle,
    relatedBlocks,
    allBlocks,
    blockRelations,
    childBlocks,
    childInstancesMap,
    blockTabs,
    referencingParams,
    updateBlockInstanceShortDescription,
    updateBlockInstanceIcon,
    updateBlockInstanceCustomIcon
  } = useBlockInstanceEditor(props.blockInstanceUuid);

  const header =( <Group>
    <IconViewer
        iconName={block?.icon}
        size={isMobile? 20 : 28}
        style={{
          color: 'white',
          boxShadow: '0px 0px 5px rgba(0,0,0,0.2)',
          backgroundColor: "var(--mantine-color-blue-5)"
        }}
    />
    <Title
        order={isMobile? 4 : 2}
        style={{
          textTransform: "capitalize",
          color: "var(--mantine-color-blue-5)"
        }}
    >
      {blockInstance?.title || ''}
    </Title>
  </Group>)

  useEffect(() =>{
    if (block) {
      setTitleElement(header);
    }
  }, [block])

  const getTabs = () => {
    if (!blockTabs) return [{ label: 'Параметры', value: 'params' }];

    return blockTabs.map(tab => {
      switch (tab.tabKind) {
        case IBlockTabKind.relation:
          return {
            label: tab.title,
            value: `related-${tab.relationUuid}`,
          };
        case IBlockTabKind.childBlock:
          return {
            label: tab.title,
            value: `child-${tab.childBlockUuid}`,
          };
        case IBlockTabKind.referencingParam:
          return {
            label: tab.title,
            value: `referencing-param-${tab.referencingParamUuid}`,
          };

        default: // parameters
          return {
            label: tab.title,
            value: 'params',
          };
      }
    });
  };

  // Обновляем список вкладок и активную вкладку при изменении blockTabs
  useEffect(() => {
    const newTabs = getTabs();
    setTabs(newTabs);

    // Устанавливаем первую вкладку как активную
    if (newTabs.length > 0) {
      setActiveTab(newTabs[0].value);
    }
  }, [blockTabs]); // Зависимость от blockTabs

  const getRelatedBlockByRelationUuid = (relationUuid: string) => {
    return relationUtils.getRelatedBlockByRelationUuid(blockRelations, relatedBlocks, relationUuid);
  }

  // Обработчик загрузки файла
  const handleFileUpload = (file: File | null) => {
    if (!file) return;

    // Проверяем тип файла
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      notifications.show({
        title: "Ошибка",
        message: "Поддерживаются только файлы JPG и PNG",
        color: "red",
      });
      return;
    }

    // Проверяем размер файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      notifications.show({
        title: "Ошибка",
        message: "Размер файла не должен превышать 5MB",
        color: "red",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        setUploadedImage(result);
        setCustomIconModalOpen(true);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      }
    };
    reader.readAsDataURL(file);
  };

  // Callback для обрезки
  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Сохранение обрезанной иконки
  const handleSaveCustomIcon = async () => {
    if (!uploadedImage || !croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(uploadedImage, croppedAreaPixels, 128);

      await updateBlockInstanceCustomIcon(croppedImage);

      setCustomIconModalOpen(false);
      setUploadedImage(null);

      notifications.show({
        title: "Успешно",
        message: "Пользовательская иконка сохранена",
      });
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось обработать изображение",
        color: "red",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Удаление пользовательской иконки
  const handleRemoveCustomIcon = async () => {
    await updateBlockInstanceCustomIcon('');

    notifications.show({
      title: "Успешно",
      message: "Пользовательская иконка удалена",
    });
  };

  // Определяем, какая иконка отображается
  const hasCustomIcon = !!blockInstance?.customIconBase64;
  const hasGameIcon = !!blockInstance?.icon;

  return (
      <>
        <Container size="lg" p={'xs'} style={{backgroundColor: '#FFF', minHeight: 'calc(100vh - 100px)'}} >
          <Box className={classes.container} pos="relative">
            <Group mb="md" className={classes.header}>
              <ActionIcon
                  onClick={() => navigate(-1)}
                  variant="light"
                  size="lg"
                  aria-label="Back to list"
              >
                <IconArrowLeft size={20}/>
              </ActionIcon>
              <Group gap="0">
                <IconViewer
                    size={18}
                    iconName={block?.icon}
                    color={"#999"}
                />
                <Text
                    color="dimmed"
                >
                  {block?.title}{block?.structureKind !== IBlockStructureKind.single ? ":" : ""}
                </Text>
              </Group>
              {block?.structureKind !== IBlockStructureKind.single &&
                  <Box>
                    <InlineEdit2 onChange={(val) => updateBlockInstanceTitle(val)} value={blockInstance?.title || ''}/>
                  </Box>
              }
            </Group>

            <Group>
              {block?.structureKind !== IBlockStructureKind.single &&
                  <Box mb="lg" style={{flex: '1'}}>
                    <InlineEdit2
                        label="Краткое описание"
                        placeholder="Краткое описание..."
                        onChange={(val) => updateBlockInstanceShortDescription(val)}
                        value={blockInstance?.shortDescription || ''}
                        size="sm"
                    />
                  </Box>
              }
            </Group>

            {/* Раздел выбора иконок для экземпляра блока */}
            {block?.structureKind !== IBlockStructureKind.single && (
                <Box mb="lg">
                  <Title order={5} mb="sm">Иконки</Title>

                  {/* Отображение Game Icons */}
                  <Group mb="md">
                    <Text size="sm" w={150}>Game Icons:</Text>
                    {hasGameIcon ? (
                        <Group gap="xs">
                          <IconViewer
                              iconName={blockInstance.icon!}
                              style={{ color: "var(--mantine-color-blue-filled)" }}
                          />
                          <Text size="sm" c="dimmed">{blockInstance.icon}</Text>
                          <Button
                              onClick={() => updateBlockInstanceIcon('')}
                              variant="subtle"
                              color="red"
                              size="xs"
                              leftSection={<IconTrash size={14} />}
                          >
                            Удалить
                          </Button>
                        </Group>
                    ) : (
                        <Text size="sm" c="dimmed">Не выбрана</Text>
                    )}
                  </Group>

                  {/* Отображение пользовательской иконки */}
                  <Group mb="md">
                    <Text size="sm" w={150}>Пользовательская:</Text>
                    {hasCustomIcon ? (
                        <Group gap="xs">
                          <MantineImage
                              src={blockInstance.customIconBase64}
                              alt="Пользовательская иконка"
                              style={{
                                width: `64px`,
                              }}
                              radius="sm"
                          />
                          <Text size="sm" c="dimmed">128×128 px</Text>
                          <Button
                              onClick={handleRemoveCustomIcon}
                              variant="subtle"
                              color="red"
                              size="xs"
                              leftSection={<IconTrash size={14} />}
                          >
                            Удалить
                          </Button>
                        </Group>
                    ) : (
                        <Text size="sm" c="dimmed">Не загружена</Text>
                    )}
                  </Group>

                  <Group gap="xs" mb="md">
                    <Button
                        onClick={() => setDrawerOpen(true)}
                        variant="outline"
                        size="sm"
                        leftSection={<IconPhoto size={16} />}
                    >
                      Выбрать из Game Icons
                    </Button>

                    <FileInput
                        placeholder="Загрузить свою иконку"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleFileUpload}
                        leftSection={<IconUpload size={16} />}
                        variant="outline"
                        size="sm"
                    />
                  </Group>
                </Box>
            )}

            <section>
              <ScrollArea
                  type="hover"
                  offsetScrollbars
                  styles={{
                    viewport: { scrollBehavior: 'smooth' },
                    root: { flex: 1 }
                  }}
              >
                <SegmentedControl
                    value={activeTab || ''}
                    onChange={setActiveTab}
                    data={tabs}
                    style={{textTransform: 'Capitalize', display: tabs.length <= 1 ? 'none' : ''}}
                />
              </ScrollArea>
              {blockTabs?.map(tab => {
                const tabValue = tab.tabKind === IBlockTabKind.relation
                    ? `related-${tab.relationUuid}`
                    : tab.tabKind === IBlockTabKind.childBlock
                        ? `child-${tab.childBlockUuid}`
                        : tab.tabKind === IBlockTabKind.referencingParam
                            ? `referencing-param-${tab.referencingParamUuid}`
                            : 'params';

                return (
                    activeTab === tabValue && (
                        <Box key={tab.uuid}>
                          <>
                            {tab.tabKind === 'parameters' &&
                                <>
                                  <InstanceParameterEditor
                                      blockInstanceUuid={props.blockInstanceUuid}
                                      blockUseTabs={block?.useTabs === 1}
                                      relatedBlocks={relatedBlocks}
                                      allBlocks={allBlocks}
                                      relations={blockRelations}
                                  />
                                </>
                            }
                          </>
                          <>
                            {tab.tabKind === 'relation' && (() => {
                              const relatedBlock = getRelatedBlockByRelationUuid(tab.relationUuid);
                              return relatedBlock && (
                                  <InstanceRelationsEditor
                                      key={tab.uuid}
                                      blockInstanceUuid={props.blockInstanceUuid}
                                      blockUuid={block?.uuid}
                                      relatedBlock={relatedBlock}
                                      blockRelation={blockRelations?.find(r => r.uuid === tab.relationUuid)}
                                  />
                              );
                            })()}
                          </>
                          <>
                            {tab.tabKind === 'childBlock' && (
                                childBlocks?.map(childBlock => (
                                    activeTab === `child-${childBlock.uuid}` && (
                                        <ChildInstancesTable
                                            key={childBlock.uuid}
                                            blockUuid={childBlock.uuid}
                                            blockInstanceUuid={props.blockInstanceUuid}
                                            instances={childInstancesMap?.[childBlock.uuid] || []}
                                            structureKind={childBlock.structureKind}
                                            relatedBlock={childBlock}
                                        />
                                    )
                                ))
                            )}
                          </>
                          <>
                            {tab.tabKind === IBlockTabKind.referencingParam && (
                                referencingParams?.map(param => (
                                    activeTab === `referencing-param-${param.uuid}` && (
                                        <ReferencedInstanceEditor
                                            block={block}
                                            referencingParam={param}
                                            instance={blockInstance}
                                        />
                                    )
                                ))
                            )}
                          </>
                        </Box>
                    ))
              })}
            </section>
          </Box>
        </Container>

        {/* Drawer для выбора Game Icons */}
        <Drawer
            opened={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            title="Выберите иконку"
            position="right"
            size="md"
        >
          <GameIconSelector
              searchQuery={searchQuery}
              onSearchChange={(e) => setSearchQuery(e.currentTarget.value)}
              onSelectIcon={(iconName) => {
                updateBlockInstanceIcon(iconName);
                updateBlockInstanceCustomIcon(''); // Очищаем пользовательскую иконку при выборе Game Icon
                setDrawerOpen(false);
              }}
          />
        </Drawer>

        {/* Модальное окно для редактирования пользовательской иконки */}
        <Modal
            opened={customIconModalOpen}
            onClose={() => {
              setCustomIconModalOpen(false);
              setUploadedImage(null);
            }}
            title="Редактирование иконки"
            size="lg"
        >
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Выберите область изображения для иконки. Результат будет изменен до размера 128×128 пикселей.
            </Text>

            {uploadedImage && (
                <div style={{ position: 'relative', width: '100%', height: 400 }}>
                  <Cropper
                      image={uploadedImage}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                  />
                </div>
            )}

            <Group justify="flex-end" gap="xs">
              <Button
                  variant="outline"
                  onClick={() => {
                    setCustomIconModalOpen(false);
                    setUploadedImage(null);
                  }}
              >
                Отмена
              </Button>
              <Button
                  onClick={handleSaveCustomIcon}
                  loading={isProcessing}
                  disabled={!croppedAreaPixels}
              >
                Сохранить иконку
              </Button>
            </Group>
          </Stack>
        </Modal>
      </>
  );
};
