// BookManager.tsx
import {
  ActionIcon,
  Button,
  Card,
  Container,
  Group,
  SimpleGrid,
  Text,
  Image as MantineImage,
  Space,
  Menu,
  LoadingOverlay, Modal, Stack, FileInput, Box, Flex,
  Tabs
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
import React, {useState, useCallback, useEffect} from "react";
import { BookEditModal } from "./BookEditModal/BookEditModal";
import { useNavigate } from "react-router-dom";
import Cropper from 'react-easy-crop';
import { Point, Area } from 'react-easy-crop/types';
import {IBook} from "@/entities/BookEntities";
import {useBookManager} from "@/components/books/BookManager/useBookManager";
import { useBookStore } from '@/stores/bookStore/bookStore';
import {notifications} from "@mantine/notifications";
import {connectToBookDatabase} from "@/entities/bookDb";
import { inkLuminAPI } from "@/api/inkLuminApi";
import {
  exportBook,
  handleFileImport
} from "@/utils/bookBackupManager";
import {
  saveBookToServer,
  loadBookFromServer
} from '@/services/bookSyncService';
import {useAuth} from "@/providers/AuthProvider/AuthProvider";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import {usePageTitle} from "@/providers/PageTitleProvider/PageTitleProvider";
import { getCroppedImg, processImageFile, handleFileChangeForCropping } from "@/utils/imageUtils";
import {importEpubFile} from "@/utils/epubUtils";
import {importFb2File} from "@/utils/fb2Utils";

const getSyncStateText = (syncState: IBook['syncState']) => {
  switch (syncState) {
    case 'localChanges':
      return 'Локальные изменения';
    case 'serverChanges':
      return 'Серверные изменения';
    case 'synced':
      return 'Синхронизировано';
    default:
      return 'Статус неизвестен';
  }
};

const getSyncStateColor = (syncState: IBook['syncState']) => {
  switch (syncState) {
    case 'localChanges':
      return 'orange';
    case 'serverChanges':
      return 'blue';
    case 'synced':
      return 'green';
    default:
      return 'gray';
  }
};

const getBlankBook = (kind: string = 'book'): IBook => ({
  uuid: "",
  title: "",
  author: "",
  form: "Роман",
  genre: "",
  configurationUuid: "",
  configurationTitle: "",
  cover: undefined,
  kind: kind,
  chapterOnlyMode: 1,
});

const getFormLabel = (formValue: string) => {
  return formValue;
};

export const BookManager = () => {
  const [isModalOpened, setIsModalOpened] = useState(false);
  const [currentBook, setCurrentBook] = useState<IBook>(getBlankBook('book'));
  const [loading, setLoading] = useState(false);
  const [loadingBookId, setLoadingBookId] = useState<string | null>(null);
  const [isServerBooksModalOpened, setIsServerBooksModalOpened] = useState(false);
  const [serverBooks, setServerBooks] = useState<any[]>([]);
  const [loadingServerBooks, setLoadingServerBooks] = useState(false);
  const [activeTab, setActiveTab] = useState<'books' | 'materials'>('books');
  const [serverBooksActiveTab, setServerBooksActiveTab] = useState<'books' | 'materials'>('books');

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
  const {setPageTitle} = usePageTitle();

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

  useEffect(() => {
    setServerBooksActiveTab(activeTab);
  }, [activeTab])

  const handleCoverImageChange = async (file: File | null) => {
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

      await saveBook(updatedBook);

      notifications.show({
        title: 'Обложка обновлена',
        message: `Обложка для книги "${editingBookCover.title}" успешно обновлена.`,
        color: 'green',
      });

      setIsCropModalOpened(false);
      setUploadedImage(null);
      setEditingBookCover(null);
      setCroppedAreaPixels(null);
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
    return book?.configurationTitle;
  };

  function onSelectBook(book: IBook) {
    if (selectedBook?.uuid === book.uuid) {
      clearSelectedBook();
    } else {
      selectBook(book);
      connectToBookDatabase(book.uuid);
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
      await refreshBooks();
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
      await refreshBooks();
    }
    setLoading(false);
  };

  const triggerEpubImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.epub';
    input.onchange = async (event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        const file = target.files[0];
        setLoading(true);
        const success = await importEpubFile(file);
        if (success && refreshBooks) {
          await refreshBooks();
        }
        setLoading(false);
      }
    };
    input.click();
  };

  const triggerFb2Import = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.fb2';
    input.onchange = async (event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        const file = target.files[0];
        setLoading(true);
        const success = await importFb2File(file);
        if (success && refreshBooks) {
          await refreshBooks();
        }
        setLoading(false);
      }
    };
    input.click();
  };

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

  // Reusable Book Card Component
  const BookCard = ({ book }: { book: IBook }) => (
      <Card key={book.uuid} shadow="sm" padding="lg" radius="md" withBorder style={{ position: 'relative' }}>
        <LoadingOverlay
            visible={loadingBookId === book.uuid}
            zIndex={100}
            overlayBlur={1}
            loaderProps={{ size: 'sm' }}
        />

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
                    setUploadedImage(null);
                    setCroppedAreaPixels(null);
                    setCrop({x: 0, y: 0});
                    setZoom(1);
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
            {book.cover ? (
                <MantineImage
                    src={book.cover}
                    alt="Book cover"
                    radius="md"
                    style={{
                      width: '100%',
                      objectFit: 'cover',
                    }}
                />
            ) : (
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
            )}
          </Box>

          {/* Right Side: Content Section */}
          <Stack style={{ flex: 1 }} justify="space-between" gap="xs">
            <Stack gap="xs">
              <Group justify="space-between" mb="xs" wrap="nowrap">
                <Text fw={500} size={isMobile ? 'md' : 'xl'} lineClamp={2}>{book.title}</Text>
                <ActionIcon color="red" variant="subtle" onClick={() => deleteBook(book)}>
                  <IconTrash size={18} />
                </ActionIcon>
              </Group>

              <Stack gap={2}>
                <Text size="sm" c="dimmed"><Text span fw={500}>Автор:</Text> {book.author}</Text>
                {book.kind !== 'material' && (
                    <>
                      <Text size="sm" c="dimmed"><Text span fw={500}>Форма:</Text> {getFormLabel(book.form)}</Text>
                      <Text size="sm" c="dimmed"><Text span fw={500}>Жанр:</Text> {book.genre}</Text>
                    </>
                )}
                <Text size="sm" c="dimmed"><Text span fw={500}>Конфигурация:</Text> {getConfigurationTitle(book)}</Text>
              </Stack>

              {book.description && (
                  <Text size="sm" c="dimmed" mt="sm" lh="lg" lineClamp={4}>
                    <Text span fw={500}>Описание:</Text> {book.description}
                  </Text>
              )}

              {book.syncState && (
                  <Group gap="xs" align="center" wrap="nowrap">
                    {book.syncState === 'synced' && <IconCheck size={14} color="green" />}
                    {book.syncState === 'localChanges' && <IconUpload size={14} color="orange" />}
                    {book.syncState === 'serverChanges' && <IconCloudDown size={14} color="blue" />}

                    <Text size="xs" c={getSyncStateColor(book.syncState)}>
                      {getSyncStateText(book.syncState)}
                    </Text>

                    {book.syncState === 'localChanges' && (
                        <ActionIcon
                            size="sm"
                            variant="light"
                            color="orange"
                            onClick={() => handleSaveToServer(book.uuid)}
                            title="Отправить на сервер"
                        >
                          <IconCloud size={16} />
                        </ActionIcon>
                    )}

                    {book.syncState === 'serverChanges' && (
                        <ActionIcon
                            size="sm"
                            variant="light"
                            color="blue"
                            onClick={() => handleLoadFromServer(book.uuid)}
                            title="Загрузить с сервера"
                        >
                          <IconDownload size={16} />
                        </ActionIcon>
                    )}
                  </Group>
              )}
            </Stack>

            <Group>
              <Button
                  variant={selectedBook?.uuid === book.uuid ? "filled" : "outline"}
                  color={selectedBook?.uuid === book.uuid ? "blue" : "gray"}
                  onClick={() => onSelectBook(book)}
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
  );

  // Filter books based on active tab
  const filteredBooks = books?.filter(book =>
      activeTab === 'books' ? book.kind !== 'material' : book.kind === 'material'
  ) || [];

  const filteredServerBooks = serverBooks.filter(book => {
    if (serverBooksActiveTab === 'materials') {
      return book.kind === 'material';
    }
    // By default, or for 'books' tab, show non-materials (including kind='book' or undefined kind)
    return book.kind !== 'material';
  });

  return (
      <>
        <Container style={{ position: 'relative' }}>
          <LoadingOverlay visible={loading} zIndex={1000} overlayBlur={2} />

          {!isMobile && (
              <h1>Управление книгами</h1>
          )}
          <Space h={20} />

          <Group mb="md" flex={1} align="center" justify="flex-start" gap={20}>
            <Button
                leftSection={<IconPlus />}
                onClick={() => {
                  const newBookKind = activeTab === 'materials' ? 'material' : 'book';
                  setCurrentBook(getBlankBook(newBookKind));
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
            <Button
                leftSection={<IconUpload size={20} />}
                onClick={triggerEpubImport}
                variant="outline"
            >
              Импорт из EPUB
            </Button>
            <Button
                leftSection={<IconUpload size={20} />}
                onClick={triggerFb2Import}
                variant="outline"
            >
              Импорт из FB2
            </Button>
            {token && (
                <Button
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
          <Tabs value={activeTab} onChange={(value) => setActiveTab(value as 'books' | 'materials')}>
            <Tabs.List>
              <Tabs.Tab value="books">Книги</Tabs.Tab>
              <Tabs.Tab value="materials">Материалы</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="books" pt="xs">
              <SimpleGrid cols={{ base: 1, sm: 1, lg: 1, xl: 1 }}>
                {filteredBooks.map((book) => (
                    <BookCard key={book.uuid} book={book} />
                ))}
              </SimpleGrid>
            </Tabs.Panel>

            <Tabs.Panel value="materials" pt="xs">
              <SimpleGrid cols={{ base: 1, sm: 1, lg: 1, xl: 1 }}>
                {filteredBooks.map((book) => (
                    <BookCard key={book.uuid} book={book} />
                ))}
              </SimpleGrid>
            </Tabs.Panel>
          </Tabs>
        </Container>

        {isModalOpened && (
            <BookEditModal
                isOpen={isModalOpened}
                onClose={() => setIsModalOpened(false)}
                onSave={saveBook}
                initialData={currentBook}
                configurations={configurations || []}
                kind={currentBook?.kind}
            />
        )}

        {/* Modal for cropping image */}
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
                onChange={handleCoverImageChange}
            />
            {uploadedImage && (
                <div style={{ position: 'relative', height: 400, width: '100%' }}>
                  <Cropper
                      image={uploadedImage}
                      crop={crop}
                      zoom={zoom}
                      aspect={200 / 285}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                  />
                </div>
            )}
            <Group mt="md">
              <Button
                  onClick={handleSaveCrop}
                  loading={processingCrop}
                  disabled={!uploadedImage || !croppedAreaPixels || processingCrop}
              >
                Сохранить обложку
              </Button>
              <Button
                  variant="outline"
                  onClick={() => {
                    setIsCropModalOpened(false);
                    setUploadedImage(null);
                    setEditingBookCover(null);
                    setCroppedAreaPixels(null);
                  }}
                  disabled={processingCrop}
              >
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

          <Tabs value={serverBooksActiveTab} onChange={(value) => setServerBooksActiveTab(value as 'books' | 'materials')}>
            <Tabs.List>
              <Tabs.Tab value="books">Книги</Tabs.Tab>
              <Tabs.Tab value="materials">Материалы</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="books" pt="xs">
              {filteredServerBooks.length === 0 && !loadingServerBooks && (
                  <Text>На сервере нет доступных книг</Text>
              )}
              <SimpleGrid cols={1} spacing="md">
                {filteredServerBooks.map((book) => (
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
            </Tabs.Panel>

            <Tabs.Panel value="materials" pt="xs">
              {filteredServerBooks.length === 0 && !loadingServerBooks && (
                  <Text>На сервере нет доступных материалов</Text>
              )}
              <SimpleGrid cols={1} spacing="md">
                {filteredServerBooks.map((book) => (
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
            </Tabs.Panel>
          </Tabs>
        </Modal>
      </>
  );
};
