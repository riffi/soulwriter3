// IconSelector.tsx
import { useState, useCallback } from 'react';
import {
  Tabs,
  Button,
  Drawer,
  Modal,
  Text,
  Stack,
  Image as MantineImage,
  FileInput
} from '@mantine/core';
import { IconPhoto, IconUpload } from '@tabler/icons-react';
import Cropper from 'react-easy-crop';
import { Point, Area } from 'react-easy-crop/types';
import { notifications } from '@mantine/notifications';
import {IIcon} from "@/entities/ConstructorEntities";
import {GameIconSelector} from "@/components/shared/GameIconSelector/GameIconSelector";

const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', error => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

const getCroppedImg = async (imageSrc: string, pixelCrop: Area, targetSize = 128): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not get canvas context');

  canvas.width = targetSize;
  canvas.height = targetSize;

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

export const IconSelector = ({ opened,
                               onSelect,
                               onClose,
                               initialIcon
                             }: {
  onSelect: (icon: IIcon) => void;
  onClose: () => void;
  initialIcon?: IIcon;
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'game'|'custom'>('game');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFileUpload = (file: File | null) => {
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      notifications.show({ title: "Ошибка", message: "Только JPG/PNG", color: "red" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      notifications.show({ title: "Ошибка", message: "Максимум 5MB", color: "red" });
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      if (typeof e.target?.result === 'string') {
        setUploadedImage(e.target.result);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      }
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSaveCustom = async () => {
    if (!uploadedImage || !croppedAreaPixels) return;

    setProcessing(true);
    try {
      const croppedImage = await getCroppedImg(uploadedImage, croppedAreaPixels);
      onSelect({
        iconKind: 'custom',
        iconName: 'custom-icon',
        iconBase64: croppedImage
      });
      onClose();
    } catch (error) {
      notifications.show({ title: "Ошибка", message: "Ошибка обработки", color: "red" });
    } finally {
      setProcessing(false);
    }
  };

  return (
      <Drawer opened={opened} position="right" onClose={onClose} title="Выбор иконки" size="md">
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="game" icon={<IconPhoto size={14} />}>Game Icons</Tabs.Tab>
            <Tabs.Tab value="custom" icon={<IconUpload size={14} />}>Загрузить</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="game" pt="md">
            <GameIconSelector
                searchQuery={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                onSelectIcon={iconName => {
                  onSelect({
                    iconKind: 'gameIcons',
                    iconName,
                    iconBase64: undefined
                  });
                  onClose();
                }}
            />
          </Tabs.Panel>

          <Tabs.Panel value="custom" pt="md">
            <Stack>
              <FileInput
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFileUpload}
                  placeholder="Выберите файл"
                  label="Загрузить изображение"
              />

              {uploadedImage && (
                  <div style={{ position: 'relative', height: 400 }}>
                    <Cropper
                        image={uploadedImage}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                  </div>
              )}

              <Button
                  onClick={handleSaveCustom}
                  disabled={!uploadedImage || processing}
                  loading={processing}
              >
                Сохранить иконку
              </Button>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Drawer>
  );
};
