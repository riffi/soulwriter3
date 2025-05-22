// MainTabContent.tsx
import {Group, Select, Checkbox, Button, Drawer, SimpleGrid, Title, FileInput, Modal, Text, Stack, Image as MantineImage} from "@mantine/core";
import {
  IBlock,
  IBlockStructureKind,
  IBlockStructureKindTitle,
  IBlockTitleForms
} from "@/entities/ConstructorEntities";
import { IconViewer } from "@/components/shared/IconViewer/IconViewer";
import {GameIconSelector} from "@/components/shared/GameIconSelector/GameIconSelector";
import React, {useState, useRef, useCallback} from "react";
import {InlineEdit2} from "@/components/shared/InlineEdit2/InlineEdit2";
import {InkLuminApi, InkLuminApiError} from "@/api/inkLuminApi";
import {notifications} from "@mantine/notifications";
import {LoadingOverlayExtended} from "@/components/shared/overlay/LoadingOverlayExtended";
import {IconUpload, IconPhoto, IconTrash} from "@tabler/icons-react";
import Cropper from 'react-easy-crop';
import { Point, Area } from 'react-easy-crop/types';

interface MainTabContentProps {
  block: IBlock;
  onSave: (blockData: IBlock, titleForms?: IBlockTitleForms) => Promise<void>;
}

const structureKindOptions = [
  { value: IBlockStructureKind.single, label: IBlockStructureKindTitle.single },
  { value: IBlockStructureKind.multiple, label: IBlockStructureKindTitle.multiple },
  { value: IBlockStructureKind.tree, label: IBlockStructureKindTitle.tree },
];

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

export const MainTabContent = ({ block, onSave }: MainTabContentProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [titleFormsLoading, setTitleFormsLoading] = useState(false);

  // Состояния для загрузки и редактирования пользовательской иконки
  const [customIconModalOpen, setCustomIconModalOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBlockPropertyChange = async (changedProps: Partial<IBlock>) => {
    const updatedBlock = { ...block, ...changedProps };
    await onSave(updatedBlock);
  };

  const handleTitleChange = async (newTitle: string) => {
    const updatedBlock = { ...block, title: newTitle };
    setTitleFormsLoading(true);
    try {
      // Попытаемся получить формы названия от InkLuminApi
      const titleForms = await InkLuminApi.fetchAndPrepareTitleForms(newTitle);
      await onSave(updatedBlock, titleForms);
    } catch (error) {
      if (error instanceof InkLuminApiError) {
        // Если API недоступен, просто сохраняем блок без обновления форм
        notifications.show({
          title: "Предупреждение",
          message: `Не удалось получить формы названия: ${error.message}`,
          color: "yellow",
        });
        await onSave(updatedBlock);
      } else {
        notifications.show({
          title: "Ошибка",
          message: "Не удалось сохранить изменения",
          color: "red",
        });
      }
    }
    finally {
      setTitleFormsLoading(false);
    }
  };

  const handleTitleFormChange = async (field: keyof IBlockTitleForms, value: string) => {
    const currentTitleForms = block.titleForms || {
      nominative: block.title || '',
      genitive: '',
      dative: '',
      accusative: '',
      instrumental: '',
      prepositional: '',
      plural: ''
    };

    const updatedTitleForms = {
      ...currentTitleForms,
      [field]: value,
    };

    await onSave(block, updatedTitleForms);
  };

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

      await handleBlockPropertyChange({
        customIconBase64: croppedImage
        // Не очищаем icon - оставляем обе иконки
      });

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
    await handleBlockPropertyChange({
      customIconBase64: ''
      // Не трогаем icon - оставляем Game Icons
    });

    notifications.show({
      title: "Успешно",
      message: "Пользовательская иконка удалена",
    });
  };

  const currentTitleForms = block.titleForms || {
    nominative: block.title || '',
    genitive: '',
    dative: '',
    accusative: '',
    instrumental: '',
    prepositional: '',
    plural: ''
  };

  // Определяем, какая иконка отображается
  const hasCustomIcon = !!block?.customIconBase64;
  const hasGameIcon = !!block?.icon;

  return (
      <>
        <LoadingOverlayExtended visible={titleFormsLoading} message="Загрузка форм названия..."/>
        <Group align="flex-end" spacing="xl" mb="md">
          <Group w={"100%"}>
            <InlineEdit2
                onChange={handleTitleChange}
                value={block?.title}
                placeholder="введите название..."
                label={"Название блока"}
            />
          </Group>
          <Group w={"100%"}>
            <InlineEdit2
                onChange={(value) => handleBlockPropertyChange({ description: value })}
                value={block?.description}
                placeholder="введите описание..."
                label={"Описание"}
            />
          </Group>
          <Group>
            <Select
                value={block?.structureKind || IBlockStructureKind.single}
                onChange={(value) => handleBlockPropertyChange({ structureKind: value })}
                data={structureKindOptions}
                label="Тип структуры"
                size="sm"
                placeholder="Выберите тип структуры"
            />
          </Group>
        </Group>

        <Checkbox
            checked={block?.useTabs === 1}
            label="Использовать вкладки для группировки параметров"
            onChange={(e) => handleBlockPropertyChange({ useTabs: e.currentTarget.checked ? 1 : 0 })}
            mt="md"
            mb="xl"
        />

        <Checkbox
            checked={block?.sceneLinkAllowed === 1}
            label="Привязка к сцене"
            onChange={(e) => handleBlockPropertyChange({ sceneLinkAllowed: e.currentTarget.checked ? 1 : 0 })}
            mt="md"
            mb="xl"
        />

        <Checkbox
            checked={block?.showInSceneList === 1}
            label="Отображать в списке сцен"
            onChange={(e) => handleBlockPropertyChange({ showInSceneList: e.currentTarget.checked ? 1 : 0 })}
            mt="md"
            mb="xl"
        />

        <Title order={4} mb="sm">Иконки блока</Title>

        {/* Отображение Game Icons */}
        <Group mb="md">
          <Text size="sm" w={150}>Game Icons:</Text>
          {hasGameIcon ? (
              <Group gap="xs">
                <IconViewer
                    iconName={block.icon!}
                    style={{ color: "var(--mantine-color-blue-filled)" }}
                />
                <Text size="sm" c="dimmed">{block.icon}</Text>
                <Button
                    onClick={() => handleBlockPropertyChange({ icon: '' })}
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
                    src={block.customIconBase64}
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

        <Group gap="xs" mb="xl">
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
                handleBlockPropertyChange({
                  icon: iconName,
                  customIconBase64: '' // Очищаем пользовательскую иконку при выборе Game Icon
                });
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

        <Title order={4} mt="xl" mb="sm">Формы названия</Title>
        <SimpleGrid cols={2} spacing="md">
          <InlineEdit2
              label="Именительный (кто? что?)"
              value={currentTitleForms.nominative}
              onChange={(value) => handleTitleFormChange('nominative', value)}
              placeholder="Именительный падеж"
          />
          <InlineEdit2
              label="Родительный (кого? чего?)"
              value={currentTitleForms.genitive}
              onChange={(value) => handleTitleFormChange('genitive', value)}
              placeholder="Родительный падеж"
          />
          <InlineEdit2
              label="Дательный (кому? чему?)"
              value={currentTitleForms.dative}
              onChange={(value) => handleTitleFormChange('dative', value)}
              placeholder="Дательный падеж"
          />
          <InlineEdit2
              label="Винительный (кого? что?)"
              value={currentTitleForms.accusative}
              onChange={(value) => handleTitleFormChange('accusative', value)}
              placeholder="Винительный падеж"
          />
          <InlineEdit2
              label="Творительный (кем? чем?)"
              value={currentTitleForms.instrumental}
              onChange={(value) => handleTitleFormChange('instrumental', value)}
              placeholder="Творительный падеж"
          />
          <InlineEdit2
              label="Предложный (о ком? о чём?)"
              value={currentTitleForms.prepositional}
              onChange={(value) => handleTitleFormChange('prepositional', value)}
              placeholder="Предложный падеж"
          />
          <InlineEdit2
              label="Множественное число (Именительный)"
              value={currentTitleForms.plural}
              onChange={(value) => handleTitleFormChange('plural', value)}
              placeholder="Множественное число"
              style={{ gridColumn: '1 / -1' }}
          />
        </SimpleGrid>
      </>
  );
};
