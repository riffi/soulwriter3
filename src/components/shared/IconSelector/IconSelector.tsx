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
import { getCroppedImg, processImageFile, handleFileChangeForCropping } from "../../../utils/imageUtils";

interface IconSelectorProps {
  opened: boolean;
  onSelect: (icon: IIcon) => void;
  onClose: () => void;
  initialIcon?: IIcon;
}

export const IconSelector = ({
                               opened,
                               onSelect,
                               onClose,
                               initialIcon
                             }: IconSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'game' | 'custom'>('game');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleIconFileUpload = async (file: File | null) => {
    await handleFileChangeForCropping(
        file,
        processImageFile,
        (base64Image) => {
          setUploadedImage(base64Image);
          setCrop({ x: 0, y: 0 });
          setZoom(1);
        },
        (errorMessage) => {
          notifications.show({
            title: 'Ошибка',
            message: errorMessage,
            color: 'red',
          });
        }
    );
  };

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSaveCustom = async () => {
    if (!uploadedImage || !croppedAreaPixels) return;

    setProcessing(true);
    try {
      const croppedImage = await getCroppedImg(uploadedImage, croppedAreaPixels, 128, 128);
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
                  onChange={handleIconFileUpload}
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
