// BookManager.tsx
import {
  ActionIcon,
  Anchor,
  Breadcrumbs,
  Button,
  Card,
  Container,
  Group,
  SimpleGrid,
  Text,
  Image as MantineImage,
  Space,
  Menu,
  LoadingOverlay, Modal, Stack, FileInput, Box, Flex
} from "@mantine/core";
import {
  IconCheck,
  IconDownload,
  IconEdit,
  IconPlus,
  IconTrash,
  IconUpload,
  IconCloud,
  IconCloudDown,
  IconDots, IconBook,
} from "@tabler/icons-react";
import React, {useState, useCallback, useEffect} from "react"; // Added useCallback
import { BookEditModal } from "./BookEditModal/BookEditModal";
import { useNavigate } from "react-router-dom";
import Cropper from 'react-easy-crop'; // Added Cropper
import { Point, Area } from 'react-easy-crop/types'; // Added Point, Area
import {IBook} from "@/entities/BookEntities";
import {useBookManager} from "@/components/books/BookManager/useBookManager";
import { useBookStore } from '@/stores/bookStore/bookStore';
import {notifications} from "@mantine/notifications";
import {connectToBookDatabase} from "@/entities/bookDb";
import { inkLuminAPI } from "@/api/inkLuminApi"; // Убедитесь в правильности пути
import {
  exportBook,
  handleFileImport,
  saveBookToServer,
  loadBookFromServer
} from "@/utils/bookBackupManager";
import {useAuth} from "@/providers/AuthProvider/AuthProvider";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import {usePageTitle} from "@/providers/PageTitleProvider/PageTitleProvider";

// Helper functions for image cropping (copied from IconSelector.tsx and modified)
const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', error => reject(error));
      image.setAttribute('crossOrigin', 'anonymous'); // Needed for cross-origin images
      image.src = url;
    });

const getCroppedImg = async (imageSrc: string, pixelCrop: Area, targetWidth: number, targetHeight: number): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not get canvas context');

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      targetWidth,
      targetHeight
  );

  return canvas.toDataURL('image/png');
};


const getBlankBook = (): IBook => ({
  uuid: "",
  title: "",
  author: "",
  form: "Роман", // Changed from kind, set default
  genre: "", // Added genre
  configurationUuid: "",
  configurationTitle: "", // Added configurationTitle
  cover: undefined,
});

export const BookManager = () => {
  const [isModalOpened, setIsModalOpened] = useState(false);
  const [currentBook, setCurrentBook] = useState<IBook>(getBlankBook());
  const [loading, setLoading] = useState(false);
  const [loadingBookId, setLoadingBookId] = useState<string | null>(null);
  const [isServerBooksModalOpened, setIsServerBooksModalOpened] = useState(false);
  const [serverBooks, setServerBooks] = useState<any[]>([]);
  const [loadingServerBooks, setLoadingServerBooks] = useState(false);

  // State for image cropping modal
  const [isCropModalOpened, setIsCropModalOpened] = useState(false);
  const [editingBookCover, setEditingBookCover] = useState<IBook | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processingCrop, setProcessingCrop] = useState(false);

  const { selectedBook, selectBook, clearSelectedBook } = useBookStore();
  const { user } = useAuth();

  const { isMobile} = useMedia();
  const token = user?.token;
  const navigate = useNavigate();
  const {setPageTitle} = usePageTitle()

  const {
    books,
    configurations,
    saveBook,
    deleteBook,
    refreshBooks
  } = useBookManager();

  useEffect(() => {
    setPageTitle('Книги')
  }, [])

  // Function to handle file input for cover image
  const handleImageUpload = (file: File | null) => {
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      notifications.show({ title: "Ошибка", message: "Только JPG/PNG файлы", color: "red" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      notifications.show({ title: "Ошибка", message: "Файл слишком большой (макс. 5MB)", color: "red" });
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      if (typeof e.target?.result === 'string') {
        setUploadedImage(e.target.result);
        setCrop({ x: 0, y: 0 }); // Reset crop and zoom for new image
        setZoom(1);
      }
    };
    reader.readAsDataURL(file);
  };

  // Callback for crop completion
  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixelsValue: Area) => {
    setCroppedAreaPixels(croppedAreaPixelsValue);
  }, []);

  // Function to save the cropped image
  const handleSaveCrop = async () => {
    if (!uploadedImage || !croppedAreaPixels || !editingBookCover) {
      notifications.show({
        title: 'Ошибка',
        message: 'Нет изображения, области обрезки или выбранной книги.',
        color: 'red',
      });
      return;
    }

    setProcessingCrop(true);
    try {
      const croppedImageBase64 = await getCroppedImg(uploadedImage, croppedAreaPixels, 200, 285);
      const updatedBook = { ...editingBookCover, cover: croppedImageBase64 };

      await saveBook(updatedBook); // Assuming saveBook handles the update in the store/DB

      notifications.show({
        title: 'Обложка обновлена',
        message: `Обложка для книги "${editingBookCover.title}" успешно обновлена.`,
        color: 'green',
      });

      setIsCropModalOpened(false);
      setUploadedImage(null);
      setEditingBookCover(null);
      setCroppedAreaPixels(null);
      // refreshBooks might be needed if useBookManager doesn't auto-update the list
      if (refreshBooks) await refreshBooks();

    } catch (error) {
      console.error("Error cropping or saving image:", error);
      notifications.show({
        title: 'Ошибка',
        message: `Не удалось сохранить обложку: ${error.message || 'Неизвестная ошибка'}`,
        color: 'red',
      });
    } finally {
      setProcessingCrop(false);
    }
  };



  const getConfigurationTitle = (book: IBook) => {
    return  book?.configurationTitle
  };

  function onSelectBook(book: IBook) {
    if (selectedBook?.uuid === book.uuid) {
      clearSelectedBook();
    } else {
      selectBook(book);
      connectToBookDatabase(book.uuid)
      notifications.show({
        title: 'Книга выбрана',
        message: `${book.title} теперь активна`,
      });
    }
  }

  const handleSaveToServer = async (bookUuid: string) => {
    if (!token) {
      notifications.show({
        message: "Для сохранения на сервер необходимо войти в систему",
        color: 'red'
      });
      return;
    }

    setLoadingBookId(bookUuid);
    const success = await saveBookToServer(bookUuid, token);
    setLoadingBookId(null);
  };

  const handleLoadFromServer = async (bookUuid: string) => {
    if (!token) {
      notifications.show({
        message: "Для загрузки с сервера необходимо войти в систему",
        color: 'red'
      });
      return;
    }

    setLoadingBookId(bookUuid);
    const success = await loadBookFromServer(bookUuid, token);
    if (success && refreshBooks) {
      await refreshBooks(); // Обновляем список локальных книг
    }
    setLoadingBookId(null);
  };

  const handleExportBook = async (bookUuid: string) => {
    setLoadingBookId(bookUuid);
    await exportBook(bookUuid);
    setLoadingBookId(null);
  };

  const handleFileImportWithRefresh = async () => {
    setLoading(true);
    const success = await handleFileImport();
    if (success && refreshBooks) {
      await refreshBooks(); // Обновляем список локальных книг
    }
    setLoading(false);
  };

  // Функция для загрузки списка книг с сервера
  const fetchServerBooks = async () => {
    if (!token) {
      notifications.show({
        message: "Для загрузки списка книг необходимо войти в систему",
        color: 'red'
      });
      return;
    }

    setLoadingServerBooks(true);
    try {
      const response = await inkLuminAPI.getBooksList(token);
      if (response.data) {
        setServerBooks(response.data);
      }
    } catch (error) {
      notifications.show({
        message: "Ошибка при загрузке списка книг",
        color: 'red'
      });
    } finally {
      setLoadingServerBooks(false);
    }
  };


  return (
      <>
        <Container  style={{ position: 'relative' }}>
          <LoadingOverlay visible={loading} zIndex={1000} overlayBlur={2} />

          {!isMobile && <>
            <h1>Управление книгами</h1>
          </>
          }
          <Space h={20} />

          <Group mb="md">
            <Button
                leftSection={<IconPlus />}
                onClick={() => {
                  setCurrentBook(getBlankBook());
                  setIsModalOpened(true);
                }}
            >
              Добавить
            </Button>

            <Button
                leftSection={<IconUpload size={20} />}
                onClick={handleFileImportWithRefresh}
                variant="outline"
            >
              Загрузить из файла
            </Button>
            {token && (<Button
                    leftSection={<IconCloudDown size={20} />}
                    onClick={() => {
                      setIsServerBooksModalOpened(true);
                      fetchServerBooks();
                    }}
                    variant="outline"
                >
                  Загрузить с сервера
                </Button>
            )}
          </Group>

          <Space h={20} />
          <SimpleGrid cols={{ base: 1, sm: 1, lg: 1, xl: 1 }}>
            {books?.map((book) => (
                <Card key={book.uuid} shadow="sm" padding="lg" radius="md" withBorder style={{ position: 'relative' }}>
                  <LoadingOverlay
                      visible={loadingBookId === book.uuid}
                      zIndex={100}
                      overlayBlur={1}
                      loaderProps={{ size: 'sm' }}
                  />

                  {/* Changed layout to a Group for side-by-side display */}
                  <Group wrap="nowrap" align="flex-start">
                    {/* Left Side: Image Section */}
                    <Box
                        style={{
                          width: isMobile ? '100px' : '200px',
                          position: 'relative',
                          flexShrink: 0
                        }}
                    >
                      <div style={{position: 'absolute', top: 8, left: 8, zIndex: 1}}>
                        <ActionIcon
                            variant="filled"
                            color="blue"
                            onClick={() => {
                              setEditingBookCover(book);
                              setUploadedImage(null); // Clear previous image
                              setCroppedAreaPixels(null); // Clear previous crop
                              setCrop({x: 0, y: 0}); // Reset crop position
                              setZoom(1); // Reset zoom
                              setIsCropModalOpened(true);
                            }}
                            title="Upload cover"
                            aria-label="Upload cover"
                            style={{
                              boxShadow: "rgb(255 255 255 / 87%) 0px 0px 1px 3px"
                            }}
                        >
                          <IconUpload size={18}/>
                        </ActionIcon>
                      </div>
                      {book.cover &&
                          <MantineImage
                              src={book.cover}
                              alt="Book cover"
                              radius="md"
                              style={{
                                width: '100%',
                                objectFit: 'cover',
                              }}
                          />
                      }
                      {!book.cover &&
                          <Box
                              style={{
                                color: '#ccc',
                                width: '200px',
                                height: '285px',
                                backgroundColor: '#f1f1f1',
                                borderRadius: "10px",
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                          >
                            <IconBook size={100} />
                          </Box>
                      }
                    </Box>

                    {/* Right Side: Content Section */}
                    <Stack style={{ flex: 1 }} justify="space-between">
                      <Stack gap="xs">
                        <Group justify="space-between"  mb="xs" wrap="nowrap">
                          <Text fw={500} size={isMobile ? 'md' : 'xl'} lineClamp={2}>{book.title}</Text>
                          <ActionIcon
                              color="red"
                              variant="subtle"
                              onClick={() => deleteBook(book)}
                          >
                            <IconTrash size={18}/>
                          </ActionIcon>
                        </Group>
                        <Text size="sm" c="dimmed">
                          <Text span fw={500} inherit>Автор:</Text> {book.author}
                        </Text>
                        <Text size="sm" c="dimmed">
                          <Text span fw={500} inherit>Форма:</Text> {getFormLabel(book.form)}
                        </Text>
                        <Text size="sm" c="dimmed">
                          <Text span fw={500} inherit>Жанр:</Text> {book.genre}
                        </Text>
                        <Text size="sm" c="dimmed">
                          <Text span fw={500} inherit>Конфигурация:</Text> {getConfigurationTitle(book)}
                        </Text>
                      </Stack>

                      <Group>
                        <Button
                            variant={selectedBook?.uuid === book.uuid ? "filled" : "outline"}
                            color={selectedBook?.uuid === book.uuid ? "blue" : "gray"}
                            onClick={() => {
                              onSelectBook(book);
                            }}
                            leftSection={
                              selectedBook?.uuid === book.uuid
                                  ? <IconCheck size={18} />
                                  : <IconPlus size={18} />
                            }
                        >
                          {selectedBook?.uuid === book.uuid ? 'Выбрана' : 'Выбрать'}
                        </Button>

                        <Menu shadow="md" width={200}>
                          <Menu.Target>
                            <Button
                                variant="outline"
                                leftSection={<IconDots size={18} />}
                            >
                              Действия
                            </Button>
                          </Menu.Target>

                          <Menu.Dropdown>
                            <Menu.Item
                                leftSection={<IconDownload size={14} />}
                                onClick={() => handleExportBook(book.uuid)}
                            >
                              Экспорт в файл
                            </Menu.Item>

                            {token && (
                                <>
                                  <Menu.Item
                                      leftSection={<IconCloud size={14} />}
                                      onClick={() => handleSaveToServer(book.uuid)}
                                  >
                                    Сохранить на сервер
                                  </Menu.Item>
                                  <Menu.Item
                                      leftSection={<IconCloudDown size={14} />}
                                      onClick={() => handleLoadFromServer(book.uuid)}
                                  >
                                    Загрузить с сервера
                                  </Menu.Item>
                                </>
                            )}

                            <Menu.Divider />

                            <Menu.Item
                                leftSection={<IconEdit size={14} />}
                                onClick={() => {
                                  setCurrentBook(book);
                                  setIsModalOpened(true);
                                }}
                            >
                              Редактировать
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Stack>
                  </Group>
                </Card>
            ))}
          </SimpleGrid>
        </Container>


        {isModalOpened && <BookEditModal
            isOpen={isModalOpened}
            onClose={() => setIsModalOpened(false)}
            onSave={saveBook}
            initialData={currentBook}
            configurations={configurations || []}
        />}

        {/* Modal for cropping image - similar to IconSelector */}
        <Modal
            opened={isCropModalOpened}
            onClose={() => {
              setIsCropModalOpened(false);
              setUploadedImage(null);
              setEditingBookCover(null);
              setCroppedAreaPixels(null);
            }}
            title={`Редактировать обложку: ${editingBookCover?.title || ''}`}
            size="lg"
        >
          <Stack>
            <FileInput
                label="Загрузить новую обложку"
                placeholder="Выберите файл (JPEG/PNG, до 5MB)"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleImageUpload} // Use the new handler
            />
            {uploadedImage && (
                <div style={{ position: 'relative', height: 400, width: '100%' }}>
                  <Cropper
                      image={uploadedImage}
                      crop={crop}
                      zoom={zoom}
                      aspect={200 / 285} // Aspect ratio for book cover
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete} // Use the new handler
                  />
                </div>
            )}
            <Group mt="md">
              <Button
                  onClick={handleSaveCrop} // Use the new handler
                  loading={processingCrop}
                  disabled={!uploadedImage || !croppedAreaPixels || processingCrop}
              >
                Сохранить обложку
              </Button>
              <Button variant="outline" onClick={() => {
                setIsCropModalOpened(false);
                setUploadedImage(null);
                setEditingBookCover(null);
                setCroppedAreaPixels(null);
              }} disabled={processingCrop}>
                Отмена
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* Модальное окно выбора книг с сервера */}
        <Modal
            opened={isServerBooksModalOpened}
            onClose={() => setIsServerBooksModalOpened(false)}
            title="Выберите книгу для загрузки"
            size="lg"
        >
          <LoadingOverlay visible={loadingServerBooks} />

          {serverBooks.length === 0 && !loadingServerBooks && (
              <Text>На сервере нет доступных книг</Text>
          )}

          <SimpleGrid cols={1} spacing="md">
            {serverBooks.map((book) => (
                <Card key={book.uuid} padding="sm" withBorder>
                  <Group justify="space-between">
                    <div>
                      <Text fw={500}>{book.bookTitle}</Text>
                    </div>
                    <Button
                        onClick={async () => {
                          await handleLoadFromServer(book.uuid);
                          setIsServerBooksModalOpened(false);
                        }}
                        loading={loadingBookId === book.uuid}
                    >
                      Загрузить
                    </Button>
                  </Group>
                </Card>
            ))}
          </SimpleGrid>
        </Modal>
      </>
  );
};

// Вспомогательные функции
const getFormLabel = (formValue: string) => {
  // Assuming formValue is already human-readable, e.g., "Роман", "Повесть"
  // as set by BookEditModal and getBlankBook
  return formValue;
};
