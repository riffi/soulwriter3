import { configDatabase } from "@/entities/configuratorDb";
import { notifications } from "@mantine/notifications";
import { connectToBookDatabase, deleteBookDatabase } from "@/entities/bookDb";
import { BlockInstanceSceneLinkRepository } from "@/repository/BlockInstance/BlockInstanceSceneLinkRepository";
import { inkLuminAPI } from "@/api/inkLuminApi";
import moment from "moment";

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
export const collectBookBackupData = async (bookUuid: string): Promise<BackupData> => {
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
    blockInstanceSceneLinks: await BlockInstanceSceneLinkRepository.getAllLinks(db),
  };
};

// Вспомогательная функция для импорта данных книги
export const importBookData = async (backupData: BackupData): Promise<void> => {
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

  // 1. Add Book data
  await db.books.add(backupData.book);

  // 2. Add Chapters and get their database IDs
  const chapterEntries = backupData.chapters || [];
  let addedChapterIds: number[] = [];
  if (chapterEntries.length > 0) {
    // Dexie's bulkAdd with allKeys: true returns an array of the generated primary keys.
    // We map to ensure we only pass properties Dexie expects for new entries.
    addedChapterIds = await db.chapters.bulkAdd(
        chapterEntries.map(c => ({ title: c.title, order: c.order })),
        { allKeys: true }
    ) as number[];
  }

  // 3. Create a map from original chapter order to new database IDs
  const chapterOrderToDbIdMap = new Map<number, number>();
  if (chapterEntries.length > 0 && addedChapterIds.length === chapterEntries.length) {
    chapterEntries.forEach((chapter, index) => {
      if (chapter.order !== undefined) { // Ensure order is present
        chapterOrderToDbIdMap.set(chapter.order, addedChapterIds[index]);
      }
    });
  }

  // 4. Update scene.chapterId to use the new database IDs
  const scenesToImport = backupData.scenes || [];
  if (scenesToImport.length > 0 && chapterOrderToDbIdMap.size > 0) {
    scenesToImport.forEach(scene => {
      const originalChapterOrder = scene.chapterId as number; // This was the chapter.order
      const dbChapterId = chapterOrderToDbIdMap.get(originalChapterOrder);
      if (dbChapterId !== undefined) {
        scene.chapterId = dbChapterId;
      } else {
        console.warn(`Scene "${scene.title}" (original chapter order: ${originalChapterOrder}) could not be mapped to a chapter DB ID. It will become chapterless.`);
        scene.chapterId = undefined; // Consistent with IScene: chapterId?: number
      }
    });
  }

  // 5. Now add scenes and other data.
  const otherPromises = [];
  if (scenesToImport.length > 0) {
    otherPromises.push(db.scenes.bulkAdd(scenesToImport));
  }
  // Ensure other arrays are also checked for length before adding to promises, if necessary,
  // though bulkAdd handles empty arrays gracefully.
  otherPromises.push(db.blockInstances.bulkAdd(backupData.blockInstances || []));
  otherPromises.push(db.blockParameterInstances.bulkAdd(backupData.blockParameterInstances || []));
  otherPromises.push(db.blockInstanceRelations.bulkAdd(backupData.blockInstanceRelations || []));
  otherPromises.push(db.bookConfigurations.bulkAdd(backupData.bookConfigurations || []));
  otherPromises.push(db.blocks.bulkAdd(backupData.blocks || []));
  otherPromises.push(db.blockParameterGroups.bulkAdd(backupData.blockParameterGroups || []));
  otherPromises.push(db.blockParameters.bulkAdd(backupData.blockParameters || []));
  otherPromises.push(db.blockParameterPossibleValues.bulkAdd(backupData.blockParameterPossibleValues || []));
  otherPromises.push(db.blocksRelations.bulkAdd(backupData.blocksRelations || []));
  otherPromises.push(db.blockTabs.bulkAdd(backupData.blockTabs || []));
  otherPromises.push(
    BlockInstanceSceneLinkRepository.bulkAddLinks(
      db,
      backupData.blockInstanceSceneLinks || []
    )
  );

  if (otherPromises.length > 0) {
    await Promise.all(otherPromises);
  }
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
