// src/hooks/useChapters.ts
import { useLiveQuery } from "dexie-react-hooks";
import { bookDb } from "@/entities/bookDb";
import { notifications } from "@mantine/notifications";
import { arrayMove } from "@dnd-kit/sortable";
import {IChapter} from "@/entities/BookEntities";


export const useChapters = () => {
  const chapters = useLiveQuery(async () => {
    const chapters = await bookDb.chapters.toArray();
    return chapters.sort((a, b) => (a.order || 0) - (b.order || 0));
  }, []);

  const createChapter = async (title: string) => {
    const lastChapterOrder = await bookDb.chapters.orderBy('order').last();
    const newChapter: IChapter = {
      title,
      order: lastChapterOrder ? lastChapterOrder.order + 1 : 1,
    };

    const chapterId = await bookDb.chapters.add(newChapter);
    notifications.show({
      title: "Успех",
      message: "Глава успешно создана",
      color: "green",
    });
    return chapterId;
  };

  const deleteChapter = async (chapterId: number) => {
    try {
      // Перед удалением главы перемещаем все её сцены в корень
      await bookDb.scenes
        .where('chapterId')
        .equals(chapterId)
        .modify({ chapterId: null });

      await bookDb.chapters.delete(chapterId);
      notifications.show({
        title: "Успешно",
        message: "Глава удалена",
        color: "green"
      });
      return true;
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось удалить главу",
        color: "red"
      });
      return false;
    }
  };

  const updateChapterOrder = async (chapterId: number, newOrder: number) => {
    try {
      await bookDb.chapters.update(chapterId, { order: newOrder });
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось обновить порядок глав",
        color: "red"
      });
    }
  };

  const reorderChapters = async (activeId: number, overId: number) => {
    if (!chapters) return;

    // Создаем копию массива для работы
    const newOrder = [...chapters];

    // Находим индексы элементов
    const oldIndex = newOrder.findIndex(chapter => chapter.id === activeId);
    const newIndex = newOrder.findIndex(chapter => chapter.id === overId);

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    // Перемещаем элемент
    const [movedItem] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, movedItem);

    // Обновляем порядковые номера
    const updates = newOrder.map((chapter, index) => ({
      id: chapter.id!,
      changes: { order: index + 1 }
    }));

    // Выполняем обновление в транзакции
    await bookDb.transaction('rw', bookDb.chapters, async () => {
      await Promise.all(
          updates.map(update =>
              bookDb.chapters.update(update.id, update.changes)
          )
      );
    });
  };

  const addSceneToChapter = async (sceneId: number, chapterId: number) => {
    try {
      await bookDb.scenes.update(sceneId, { chapterId });
      notifications.show({
        title: "Успешно",
        message: "Сцена добавлена в главу",
        color: "green"
      });
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось добавить сцену в главу",
        color: "red"
      });
    }
  };

  const removeSceneFromChapter = async (sceneId: number) => {
    try {
      await bookDb.scenes.update(sceneId, { chapterId: undefined });
      notifications.show({
        title: "Успешно",
        message: "Сцена удалена из главы",
        color: "green"
      });
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось удалить сцену из главы",
        color: "red"
      });
    }
  };

  const updateChapter = async (chapterId: number, title: string) => {
    try {
      await bookDb.chapters.update(chapterId, {title});
      notifications.show({
        title: "Успех",
        message: "Глава успешно обновлена",
        color: "green"
      })
    }
    catch(error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось обновить главу",
        color: "red"
      })
    }
  }

  return {
    chapters,
    createChapter,
    deleteChapter,
    reorderChapters,
    updateChapterOrder,
    addSceneToChapter,
    removeSceneFromChapter,
    updateChapter
  };
};
