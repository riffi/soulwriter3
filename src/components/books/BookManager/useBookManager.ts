import { IBook } from "@/entities/BookEntities";
import { configDatabase } from "@/entities/configuratorDb";
import { notifications } from "@mantine/notifications";
import { useLiveQuery } from "dexie-react-hooks";
import { IBookConfiguration } from "@/entities/ConstructorEntities";
import { useDialog } from "@/providers/DialogProvider/DialogProvider";
import { useBookStore } from "@/stores/bookStore/bookStore";
import { BookService } from "@/services/bookService";

export const useBookManager = () => {

  const { showDialog } = useDialog();
  const { clearSelectedBook } = useBookStore();

  // Получаем список книг и конфигураций из базы данных
  const books = useLiveQuery<IBook[]>(() => configDatabase.books.toArray(), []);
  const configurations = useLiveQuery<IBookConfiguration[]>(
      () => configDatabase.bookConfigurations.toArray(),
      []
  );


  const saveBook = async (book: IBook) => {
    const result = await BookService.saveBook(book);
    if (result.success) {
      notifications.show({
        title: "Книга",
        message: `Книга "${book.title}" сохранена`,
      });
    } else {
      notifications.show({
        title: "Ошибка",
        message: result.message || "Не удалось сохранить книгу",
        color: "red",
      });
    }
  };

  const deleteBook = async (book: IBook) => {
    const confirm = await showDialog(
      "Подтверждение",
      `Вы уверены, что хотите удалить книгу ${book.title}?`
    );
    if (confirm) {
      clearSelectedBook();
      const result = await BookService.deleteBook(book);
      if (result.success) {
        notifications.show({
          title: "Книга",
          message: `Книга "${book.title}" удалена`,
        });
      } else {
        notifications.show({
          title: "Ошибка",
          message: result.message || "Не удалось удалить книгу",
          color: "red",
        });
      }
    }
  };

  const refreshBooks = async () => {
    await configDatabase.books.toArray();
  };

  return {
    books,
    configurations,
    saveBook,
    deleteBook,
    refreshBooks
  }
}

