import {IBook} from "@/entities/BookEntities";
import {configDatabase} from "@/entities/db";
import {generateUUID} from "@/utils/UUIDUtils";
import {notifications} from "@mantine/notifications";
import {useLiveQuery} from "dexie-react-hooks";
import {IBookConfiguration} from "@/entities/ConstructorEntities";
import {useDialog} from "@/providers/DialogProvider/DialogProvider";
import {bookDb, connectToBookDatabase} from "@/entities/bookDb";

export const useBookManager = () => {

  const { showDialog } = useDialog();

  // Получаем список книг и конфигураций из базы данных
  const books = useLiveQuery<IBook[]>(() => configDatabase.books.toArray(), []);
  const configurations = useLiveQuery<IBookConfiguration[]>(
      () => configDatabase.bookConfigurations.toArray(),
      []
  );

  async function initBookDb(book: IBook) {
    await connectToBookDatabase(book.uuid)

    // Получаем конфигурацию для книги
    const configuration = await configDatabase
      .bookConfigurations
      .where({uuid: book.configurationUuid})
      .first();
    if (configuration) {
      // Копируем конфигурацию в базу данных книги
      bookDb.bookConfiguration.add(configuration)

      // Получаем блоки конфигурации
      const blocks = await configDatabase.blocks.where({configurationUuid: configuration.uuid}).toArray()

      // Копируем блоки в базу данных книги
      await bookDb.blocks.bulkAdd(blocks)

      for (const block of blocks) {
        // Получаем группы параметров блока
        const blockParameterGroups = await configDatabase.blockParameterGroups.where({blockUuid: block.uuid}).toArray()

        // Копируем группы параметров в базу данных книги
        await bookDb.blockParameterGroups.bulkAdd(blockParameterGroups)

        for (const blockParameterGroup of blockParameterGroups) {

          // Получаем параметры группы
          const blockParameters = await configDatabase.blockParameters.where({groupUuid: blockParameterGroup.uuid}).toArray()

          // Копируем параметры группы в базу данных книги
          await bookDb.blockParameters.bulkAdd(blockParameters)
          for (const blockParameter of blockParameters) {

            // Получаем возможные значения параметра
            const blockParameterPossibleValues = await configDatabase.blockParameterPossibleValues.where({parameterUuid: blockParameter.uuid}).toArray()

            // Копируем возможные значения параметра в базу данных книги
            await bookDb.blockParameterPossibleValues.bulkAdd(blockParameterPossibleValues)
          }
        }
      }
    }
  }

  const saveBook = async (book: IBook) => {
    try {
      if (book.uuid) {
        await configDatabase.books.update(book.id, book);
      } else {
        book.uuid = generateUUID();
        await configDatabase.books.add(book);
        await initBookDb(book);
      }
      notifications.show({
        title: "Книга",
        message: `Книга "${book.title}" сохранена`,
      });
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось сохранить книгу",
        color: "red",
      });
    }
  };

  const deleteBook = async (book: IBook) => {
    const result = await showDialog(
        "Подтверждение",
        `Вы уверены, что хотите удалить книгу ${book.title}?`
    );
    if (result){
      try {
        await configDatabase.books.delete(book.id);
        notifications.show({
          title: "Книга",
          message: `Книга "${book.title}" удалена`,
        });
      } catch (error) {
        notifications.show({
          title: "Ошибка",
          message: "Не удалось удалить книгу",
          color: "red",
        });
      }
    }
  };

  return {
    books,
    configurations,
    saveBook,
    deleteBook
  }
}
