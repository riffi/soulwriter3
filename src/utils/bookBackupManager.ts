import { configDatabase } from "@/entities/configuratorDb";
import { notifications } from "@mantine/notifications";
import { connectToBookDatabase, deleteBookDatabase } from "@/entities/bookDb";


export interface BackupData {
  book: any;
  scenes: any[];
  chapters: any[];
  blockInstances: any[];
  blockParameterInstances: any[];
  blockInstanceRelations: any[];
  bookConfigurations: any[];
  configurationVersions: any[];
  blocks: any[];
  blockParameterGroups: any[];
  blockParameters: any[];
  blockParameterPossibleValues: any[];
  blocksRelations: any[];
  blockTabs: any[];
  blockInstanceSceneLinks: any[];
}

export const exportBook = async (bookUuid: string) => {
  try {
    const [bookData, db] = await Promise.all([
      configDatabase.books.get({ uuid: bookUuid }),
      connectToBookDatabase(bookUuid),
    ]);

    if (!bookData) throw new Error("Книга не найдена");

    const backupData: BackupData = {
      book: { ...bookData, id: undefined },
      scenes: await db.scenes.toArray(),
      chapters: await db.chapters.toArray(),
      blockInstances: await db.blockInstances.toArray(),
      blockParameterInstances: await db.blockParameterInstances.toArray(),
      blockInstanceRelations: await db.blockInstanceRelations.toArray(),
      bookConfigurations: await db.bookConfigurations.toArray(),
      configurationVersions: await db.configurationVersions.toArray(),
      blocks: await db.blocks.toArray(),
      blockParameterGroups: await db.blockParameterGroups.toArray(),
      blockParameters: await db.blockParameters.toArray(),
      blockParameterPossibleValues: await db.blockParameterPossibleValues.toArray(),
      blocksRelations: await db.blocksRelations.toArray(),
      blockTabs: await db.blockTabs.toArray(),
      blockInstanceSceneLinks: await db.blockInstanceSceneLinks.toArray(),
    };

    const blob = new Blob([JSON.stringify(backupData)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `book-backup-${bookData.title}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    notifications.show({ message: "Ошибка экспорта", color: "red" });
    return false;
  }
};

export const importBookBackup = async (file: File) => {
  try {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);

          if (!data?.book?.uuid) {
            throw new Error("Неверный формат файла бэкапа");
          }

          // Обновление/добавление записи книги
          const existingBook = await configDatabase.books.get({ uuid: data.book.uuid });
          if (existingBook) {
            await configDatabase.books.update(existingBook.id, { ...data.book });
          } else {
            await configDatabase.books.add({ ...data.book });
          }

          // Удаление старой БД и создание новой
          await deleteBookDatabase(data.book.uuid);
          const db = connectToBookDatabase(data.book.uuid);

          // Импорт данных
          await Promise.all([
            db.scenes.bulkAdd(data.scenes || []),
            db.chapters.bulkAdd(data.chapters || []),
            db.blockInstances.bulkAdd(data.blockInstances || []),
            db.blockParameterInstances.bulkAdd(data.blockParameterInstances || []),
            db.blockInstanceRelations.bulkAdd(data.blockInstanceRelations || []),
            db.bookConfigurations.bulkAdd(data.bookConfigurations || []),
            db.configurationVersions.bulkAdd(data.configurationVersions || []),
            db.blocks.bulkAdd(data.blocks || []),
            db.blockParameterGroups.bulkAdd(data.blockParameterGroups || []),
            db.blockParameters.bulkAdd(data.blockParameters || []),
            db.blockParameterPossibleValues.bulkAdd(data.blockParameterPossibleValues || []),
            db.blocksRelations.bulkAdd(data.blocksRelations || []),
            db.blockTabs.bulkAdd(data.blockTabs || []),
            db.blockInstanceSceneLinks.bulkAdd(data.blockInstanceSceneLinks || []),
          ]);

          notifications.show({ message: "Книга успешно импортирована" });
          resolve(true);
        } catch (error) {
          notifications.show({
            message: error.message,
            color: "red",
          });
          reject(error);
        }
      };

      reader.readAsText(file);
    });
  } catch (error) {
    notifications.show({
      message: error.message,
      color: "red",
    });
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
