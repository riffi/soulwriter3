import { configDatabase } from "@/entities/configuratorDb";
import { notifications } from "@mantine/notifications";
import { connectToBookDatabase, deleteBookDatabase } from "@/entities/bookDb";
import { inkLuminAPI } from "@/api/inkLuminApi";

export interface BackupData {
  book: any;
  scenes: any[];
  chapters: any[];
  blockInstances: any[];
  blockParameterInstances: any[];
  blockInstanceRelations: any[];
  bookConfigurations: any[];
  blocks: any[];
  blockParameterGroups: any[];
  blockParameters: any[];
  blockParameterPossibleValues: any[];
  blocksRelations: any[];
  blockTabs: any[];
  blockInstanceSceneLinks: any[];
}

// Вспомогательная функция для сбора данных книги
const collectBookBackupData = async (bookUuid: string): Promise<BackupData> => {
  const [bookData, db] = await Promise.all([
    configDatabase.books.get({ uuid: bookUuid }),
    connectToBookDatabase(bookUuid),
  ]);

  if (!bookData) throw new Error("Книга не найдена");

  return {
    book: { ...bookData, id: undefined },
    scenes: await db.scenes.toArray(),
    chapters: await db.chapters.toArray(),
    blockInstances: await db.blockInstances.toArray(),
    blockParameterInstances: await db.blockParameterInstances.toArray(),
    blockInstanceRelations: await db.blockInstanceRelations.toArray(),
    bookConfigurations: await db.bookConfigurations.toArray(),
    blocks: await db.blocks.toArray(),
    blockParameterGroups: await db.blockParameterGroups.toArray(),
    blockParameters: await db.blockParameters.toArray(),
    blockParameterPossibleValues: await db.blockParameterPossibleValues.toArray(),
    blocksRelations: await db.blocksRelations.toArray(),
    blockTabs: await db.blockTabs.toArray(),
    blockInstanceSceneLinks: await db.blockInstanceSceneLinks.toArray(),
  };
};

// Вспомогательная функция для импорта данных книги
const importBookData = async (backupData: BackupData): Promise<void> => {
  if (!backupData?.book?.uuid) {
    throw new Error("Неверный формат данных");
  }

  // Обновление/добавление записи книги
  const existingBook = await configDatabase.books.get({ uuid: backupData.book.uuid });
  if (existingBook) {
    await configDatabase.books.update(existingBook.id, { ...backupData.book });
  } else {
    await configDatabase.books.add({ ...backupData.book });
  }

  // Удаление старой БД и создание новой
  await deleteBookDatabase(backupData.book.uuid);
  const db = connectToBookDatabase(backupData.book.uuid);

  // Импорт данных
  await Promise.all([
    db.books.add(backupData.book),
    db.scenes.bulkAdd(backupData.scenes || []),
    db.chapters.bulkAdd(backupData.chapters || []),
    db.blockInstances.bulkAdd(backupData.blockInstances || []),
    db.blockParameterInstances.bulkAdd(backupData.blockParameterInstances || []),
    db.blockInstanceRelations.bulkAdd(backupData.blockInstanceRelations || []),
    db.bookConfigurations.bulkAdd(backupData.bookConfigurations || []),
    db.blocks.bulkAdd(backupData.blocks || []),
    db.blockParameterGroups.bulkAdd(backupData.blockParameterGroups || []),
    db.blockParameters.bulkAdd(backupData.blockParameters || []),
    db.blockParameterPossibleValues.bulkAdd(backupData.blockParameterPossibleValues || []),
    db.blocksRelations.bulkAdd(backupData.blocksRelations || []),
    db.blockTabs.bulkAdd(backupData.blockTabs || []),
    db.blockInstanceSceneLinks.bulkAdd(backupData.blockInstanceSceneLinks || []),
  ]);
};

// Вспомогательная функция для показа уведомлений об ошибках
const showErrorNotification = (message: string, error?: any) => {
  const errorMessage = error?.message ? `${message}: ${error.message}` : message;
  notifications.show({
    message: errorMessage,
    color: "red"
  });
};

export const exportBook = async (bookUuid: string) => {
  try {
    const backupData = await collectBookBackupData(bookUuid);

    const blob = new Blob([JSON.stringify(backupData)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `book-backup-${backupData.book.title}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    showErrorNotification("Ошибка экспорта", error);
    return false;
  }
};

export const saveBookToServer = async (bookUuid: string, token: string) => {
  try {
    const backupData = await collectBookBackupData(bookUuid);

    const response = await inkLuminAPI.saveBookData(token, {
      uuid: bookUuid,
      bookTitle: backupData.book.title,
      kind: backupData.book.kind,
      bookData: JSON.stringify(backupData)
    });

    if (response.success) {
      notifications.show({
        message: "Книга успешно сохранена на сервер",
        color: "green"
      });
      return true;
    } else {
      throw new Error(response.message || "Ошибка сохранения на сервер");
    }
  } catch (error) {
    showErrorNotification("Ошибка сохранения на сервер", error);
    return false;
  }
};

export const loadBookFromServer = async (bookUuid: string, token: string) => {
  try {
    const response = await inkLuminAPI.getBookData(token, bookUuid);

    if (!response.success) {
      throw new Error(response.message || "Ошибка загрузки с сервера");
    }

    const backupData: BackupData = JSON.parse(response.data.bookData);
    await importBookData(backupData);

    notifications.show({
      message: "Книга успешно загружена с сервера",
      color: "green"
    });
    return true;
  } catch (error) {
    showErrorNotification("Ошибка загрузки с сервера", error);
    return false;
  }
};

export const getServerBooksList = async (token: string) => {
  try {
    const response = await inkLuminAPI.getBooksList(token);

    if (response.success) {
      return response.data || [];
    } else {
      throw new Error(response.message || "Ошибка получения списка книг");
    }
  } catch (error) {
    showErrorNotification("Ошибка получения списка книг с сервера", error);
    return [];
  }
};

export const importBookBackup = async (file: File) => {
  try {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = async (event) => {
        try {
          const backupData: BackupData = JSON.parse(event.target?.result as string);
          await importBookData(backupData);

          notifications.show({
            message: "Книга успешно импортирована",
            color: "green"
          });
          resolve(true);
        } catch (error) {
          showErrorNotification("Ошибка импорта", error);
          reject(error);
        }
      };

      reader.readAsText(file);
    });
  } catch (error) {
    showErrorNotification("Ошибка импорта", error);
    return false;
  }
};

export const handleFileImport = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";

  return new Promise((resolve) => {
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      resolve(file ? await importBookBackup(file) : false);
    };
    input.click();
  });
};
