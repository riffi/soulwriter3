import {IBook} from "@/entities/BookEntities";
import {configDatabase} from "@/entities/configuratorDb";
import {generateUUID} from "@/utils/UUIDUtils";
import {notifications} from "@mantine/notifications";
import {useLiveQuery} from "dexie-react-hooks";
import {IBlock, IBlockStructureKind, IBookConfiguration} from "@/entities/ConstructorEntities";
import {useDialog} from "@/providers/DialogProvider/DialogProvider";
import {bookDb, connectToBookDatabase, deleteBookDatabase} from "@/entities/bookDb";
import {BlockInstanceRepository} from "@/repository/BlockInstanceRepository";
import {BlockRepository} from "@/repository/BlockRepository";
import {useBookStore} from "@/stores/bookStore/bookStore";

export const useBookManager = () => {

  const { showDialog } = useDialog();
  const { selectedBook, selectBook, clearSelectedBook } = useBookStore();

  // Получаем список книг и конфигураций из базы данных
  const books = useLiveQuery<IBook[]>(() => configDatabase.books.toArray(), []);
  const configurations = useLiveQuery<IBookConfiguration[]>(
      () => configDatabase.bookConfigurations.toArray(),
      []
  );

  //  Создание Базы данных для книги
  async function initBookDb(book: IBook) {
    await connectToBookDatabase(book.uuid);
    let configuration: IBookConfiguration | undefined;

    const isNew = !book.configurationUuid;
    if (book.configurationUuid){
      configuration = await getBookConfiguration(book.configurationUuid)
      if (!configuration) {
        notifications.show({
          title: "Ошибка",
          message: "Конфигурация не найдена",
          color: "red",
        });
        return
      }
    }
    else{
      configuration = {
        uuid: "",
        title: book.title,
        description:"",
      }
    }

    const configurationUuid = await copyConfigurationToBookDb(configuration, isNew);
    book.configurationUuid = configurationUuid;

    await bookDb.books.add(book);
  }

  // Получение конфигурации по UUID
  async function getBookConfiguration(configurationUuid: string) {
    return configDatabase
    .bookConfigurations
    .where({ uuid: configurationUuid })
    .first();
  }

  // Копирование конфигурации в базу данных книги
  async function copyConfigurationToBookDb(configuration: IBookConfiguration, isNew: boolean = false) {
    const newConfigurationUuid = generateUUID()
    await bookDb.bookConfigurations.add({...configuration, uuid: newConfigurationUuid});
    if (!isNew) {
      await copyBlocks(configuration.uuid, newConfigurationUuid);
      await copyBlockRelations(configuration.uuid, newConfigurationUuid);
    }
    return newConfigurationUuid
  }


  // Копирование связей блоков в базу данных книги
  async function copyBlockRelations(oldConfigurationUuid: string, newConfigurationUuid: string) {
    const relations = await configDatabase.blocksRelations
      .where({ configurationUuid: oldConfigurationUuid }).toArray();

    relations.forEach(relation => {
      relation.configurationUuid = newConfigurationUuid;
    })

    await bookDb.blocksRelations.bulkAdd(relations);
  }

  async function createSingleInstance(block: IBlock) {
    if (block.structureKind === IBlockStructureKind.single) {
      const instance = await BlockInstanceRepository.createSingleInstance(bookDb, block);
      await BlockInstanceRepository.appendDefaultParams(bookDb, instance)
    }
  }

  // Копирование блоков версии конфигурации в базу данных книги
  async function copyBlocks(oldConfigurationUuid: string, newConfigurationUuid: string) {
    const blocks = await configDatabase.blocks
    .where({ configurationUuid: oldConfigurationUuid })
    .toArray();

    blocks.forEach(block => {
      block.configurationUuid = newConfigurationUuid;
    })

    await bookDb.blocks.bulkAdd(blocks);

    // Сначала копируем все параметры и группы
    await Promise.all(blocks.map(block => {
      return Promise.all([
        copyBlockParameterGroups(block.uuid),
        copyBlockTabs(block.uuid)
      ]);
    }));

    await Promise.all(blocks.map(block =>{
          createSingleInstance(block);
        }
    ));

  }

  // Копирование вкладок блока в базу данных книги
  async function copyBlockTabs(blockUuid: string) {
    const tabs = await configDatabase.blockTabs
      .where({ blockUuid })
      .toArray();

    await bookDb.blockTabs.bulkAdd(tabs);
  }

  // Копирование групп параметров блока в базу данных книги
  async function copyBlockParameterGroups(blockUuid: string) {
    const parameterGroups = await configDatabase.blockParameterGroups
    .where({ blockUuid })
    .toArray();

    await bookDb.blockParameterGroups.bulkAdd(parameterGroups);

    await Promise.all(parameterGroups.map(group =>
        copyBlockParameters(group.uuid)
    ));
  }

  // Копирование параметров группы в базу данных книги
  async function copyBlockParameters(groupUuid: string) {
    const parameters = await configDatabase.blockParameters
    .where({ groupUuid })
    .toArray();

    await bookDb.blockParameters.bulkAdd(parameters);

    await Promise.all(parameters.map(parameter =>
        copyParameterPossibleValues(parameter.uuid)
    ));
  }

  // Копирование вариантов параметра в базу данных книги
  async function copyParameterPossibleValues(parameterUuid: string) {
    const possibleValues = await configDatabase.blockParameterPossibleValues
    .where({ parameterUuid })
    .toArray();

    await bookDb.blockParameterPossibleValues.bulkAdd(possibleValues);
  }

  const saveBook = async (book: IBook) => {
    try {
      if (book.uuid) {
        await configDatabase.books.update(book.id, book);
      } else {
        book.uuid = generateUUID();
        await initBookDb(book);
        await configDatabase.books.add(book);
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
        clearSelectedBook()
        await configDatabase.books.delete(book.id);
        await deleteBookDatabase(book.uuid);
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
