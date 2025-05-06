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
    const configuration = await getBookConfiguration(book.configurationUuid);

    if (!configuration) return;
    await bookDb.books.add(book);
    await copyConfigurationToBookDb(configuration, book.configurationVersionNumber);
  }

  // Получение конфигурации по UUID
  async function getBookConfiguration(configurationUuid: string) {
    return configDatabase
    .bookConfigurations
    .where({ uuid: configurationUuid })
    .first();
  }

  // Копирование конфигурации в базу данных книги
  async function copyConfigurationToBookDb(configuration: IBookConfiguration, currentVersion?: number) {
    await bookDb.bookConfigurations.add(configuration);
    await copyConfigurationVersion(configuration.uuid, currentVersion);
  }

  // Копирование версий конфигурации в базу данных книги
  async function copyConfigurationVersion(configurationUuid: string, versionNumber?: number) {
    const version = await configDatabase.configurationVersions
      .where({ configurationUuid })
      .and(version => !versionNumber || version.versionNumber === versionNumber)
      .first();

    if (!version) return;

    await bookDb.configurationVersions.add(version);

    await copyVersionBlocks(version.uuid)
    await copyBlockRelations(version.uuid)
  }

  // Копирование связей блоков в базу данных книги
  async function copyBlockRelations(configurationVersionUuid: string) {
    const relations = await configDatabase.blocksRelations
      .where({ configurationVersionUuid }).toArray();
    await bookDb.blocksRelations.bulkAdd(relations);
  }

  async function createSingleInstance(block: IBlock) {
    if (block.structureKind === IBlockStructureKind.single) {
      const instance = await BlockInstanceRepository.createSingleInstance(bookDb, block);
      await BlockInstanceRepository.appendDefaultParams(bookDb, instance)
    }
  }

  // Копирование блоков версии конфигурации в базу данных книги
  async function copyVersionBlocks(versionUuid: string) {
    const blocks = await configDatabase.blocks
    .where({ configurationVersionUuid: versionUuid })
    .toArray();

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
        const version = await configDatabase
        .configurationVersions
          .where('configurationUuid')
          .equals(book.configurationUuid)
          .and(version => version.isDraft === 1)
          .sortBy('versionNumber')
          .then(versions => versions[versions.length - 1]);
        book.configurationVersionNumber = version?.versionNumber || 0;
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
