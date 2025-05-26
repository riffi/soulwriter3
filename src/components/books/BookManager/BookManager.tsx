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
  Image,
  Space,
  Menu,
  LoadingOverlay, Modal,
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
  IconDots,
} from "@tabler/icons-react";
import React, { useState } from "react";
import { BookEditModal } from "./BookEditModal/BookEditModal";
import { useNavigate } from "react-router-dom";
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

const getBlankBook = (): IBook => ({
  uuid: "",
  title: "",
  author: "",
  kind: "novel",
  configurationUuid: "",
});

export const BookManager = () => {
  const [isModalOpened, setIsModalOpened] = useState(false);
  const [currentBook, setCurrentBook] = useState<IBook>(getBlankBook());
  const [loading, setLoading] = useState(false);
  const [loadingBookId, setLoadingBookId] = useState<string | null>(null);
  const [isServerBooksModalOpened, setIsServerBooksModalOpened] = useState(false);
  const [serverBooks, setServerBooks] = useState<any[]>([]);
  const [loadingServerBooks, setLoadingServerBooks] = useState(false);

  const { selectedBook, selectBook, clearSelectedBook } = useBookStore();
  const { user } = useAuth();
  const token = user?.token;
  const navigate = useNavigate();

  const {
    books,
    configurations,
    saveBook,
    deleteBook,
    refreshBooks
  } = useBookManager()


  const breadCrumbs = [
    { title: "Книги", href: "#" },
  ].map((item, index) => (
      <Anchor href={item.href} key={index}>
        {item.title}
      </Anchor>
  ));

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
        <Container fluid style={{ position: 'relative' }}>
          <LoadingOverlay visible={loading} zIndex={1000} overlayBlur={2} />

          <h1>Управление книгами</h1>
          <Breadcrumbs separator="→" separatorMargin="md" mt="xs">
            {breadCrumbs}
          </Breadcrumbs>
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
          </Group>

          <Space h={20} />
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 2, xl: 4 }}>
            {books?.map((book) => (
                <Card key={book.uuid} shadow="sm" padding="lg" radius="md" withBorder style={{ position: 'relative' }}>
                  <LoadingOverlay
                      visible={loadingBookId === book.uuid}
                      zIndex={100}
                      overlayBlur={1}
                      loaderProps={{ size: 'sm' }}
                  />

                  <Card.Section>
                    <Image
                        src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/images/bg-8.png"
                        height={160}
                        alt="Book cover"
                    />
                  </Card.Section>
                  <Group justify="space-between" mt="md" mb="xs">
                    <Text fw={500}>{book.title}</Text>
                    <ActionIcon
                        color="red"
                        variant="subtle"
                        onClick={() => deleteBook(book)}
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Group>
                  <Text size="sm" c="dimmed">
                    Автор: {book.author}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Тип: {getKindLabel(book.kind)}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Конфигурация: {getConfigurationTitle(book)}
                  </Text>
                  <Group mt="md" grow>
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
const getKindLabel = (kind: string) => {
  const kindList = {
    novel: "Роман",
    story: "Рассказ",
    novella: "Повесть",
    poem: "Поэма",
    other: "Другое",
  };
  return kindList[kind as keyof typeof kindList] || kind;
};
