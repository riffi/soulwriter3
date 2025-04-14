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
  Select,
} from "@mantine/core";
import {IconCheck, IconEdit, IconPlus, IconTrash} from "@tabler/icons-react";
import React, { useState } from "react";
import { BookEditModal } from "./BookEditModal/BookEditModal";
import { useNavigate } from "react-router-dom";
import {IBook} from "@/entities/BookEntities";
import {useBookManager} from "@/components/books/BookManager/useBookManager";
import { useBookStore } from '@/stores/bookStore/bookStore';
import {notifications} from "@mantine/notifications";
import {connectToBookDatabase} from "@/entities/bookDb";

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

  const { selectedBook, selectBook, clearSelectedBook } = useBookStore();
  const navigate = useNavigate();

 const {
   books,
   configurations,
   saveBook,
   deleteBook
 } = useBookManager()


  const breadCrumbs = [
    { title: "Книги", href: "#" },
  ].map((item, index) => (
      <Anchor href={item.href} key={index}>
        {item.title}
      </Anchor>
  ));

  const getConfigurationTitle = (uuid: string) => {
    return configurations?.find((c) => c.uuid === uuid)?.title || "Не выбрана";
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

  return (
      <>
        <Container fluid>
          <h1>Управление книгами</h1>
          <Breadcrumbs separator="→" separatorMargin="md" mt="xs">
            {breadCrumbs}
          </Breadcrumbs>
          <Space h={20} />
          <Button
              leftSection={<IconPlus />}
              onClick={() => {
                setCurrentBook(getBlankBook());
                setIsModalOpened(true);
              }}
          >
            Добавить книгу
          </Button>
          <Space h={20} />
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 2, xl: 4 }}>
            {books?.map((book) => (
                <Card key={book.uuid} shadow="sm" padding="lg" radius="md" withBorder>
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
                    Конфигурация: {getConfigurationTitle(book.configurationUuid)}
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
                  </Group>
                  <Group mt="md">
                    <Button
                        fullWidth
                        variant="outline"
                        leftSection={<IconEdit size={18} />}
                        onClick={() => {
                          setCurrentBook(book);
                          setIsModalOpened(true);
                        }}
                    >
                      Редактировать
                    </Button>
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


