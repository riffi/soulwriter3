// src/hooks/useScenes.ts
import { useLiveQuery } from "dexie-react-hooks";
import { bookDb } from "@/entities/bookDb";
import { IScene } from "@/entities/BookEntities";
import { notifications } from "@mantine/notifications";
import {arrayMove} from "@dnd-kit/sortable";

export const useScenes = () => {
  const scenes = useLiveQuery(async () => {
    const scenes = await bookDb.scenes.toArray();
    return scenes.sort((a, b) => (a.order || 0) - (b.order || 0));
  }, []);

  const createScene = async (title: string, chapterId?: number) => {
    const lastSceneOrder = await bookDb.scenes.orderBy('order').last();
    const newScene: IScene = {
      title,
      body: "",
      order: lastSceneOrder ? lastSceneOrder.order + 1 : 1,
      chapterId,
    }

    const sceneId = await bookDb.scenes.add(newScene);
    notifications.show({
      title: "Успех",
      message: "Сцена успешно создана",
      color: "green",
    });
    return sceneId;
  }

  const deleteScene = async (sceneId: number) => {
    try {
      await bookDb.scenes.delete(sceneId);
      notifications.show({
        title: "Успешно",
        message: "Сцена удалена",
        color: "green"
      });
      return true;
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось удалить сцену",
        color: "red"
      });
      return false;
    }
  };

  const updateSceneOrder = async (sceneId: number, newOrder: number) => {
    try {
      await bookDb.scenes.update(sceneId, { order: newOrder });
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось обновить порядок сцен",
        color: "red"
      });
    }
  };


  const updateScene = async (sceneId: number, sceneData: IScene) => {
    try {
      await bookDb.scenes.update(sceneId, sceneData);
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось обновить сцену"
      })
    }
  }

  const reorderScenes = async (activeId: number, overId: number) => {
    if (!scenes) return;

    // Создаем копию массива для работы
    const newOrder = [...scenes];

    // Находим индексы элементов
    const oldIndex = newOrder.findIndex(scene => scene.id === activeId);
    const newIndex = newOrder.findIndex(scene => scene.id === overId);

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    // Перемещаем элемент
    const [movedItem] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, movedItem);

    // Обновляем порядковые номера
    const updates = newOrder.map((scene, index) => ({
      id: scene.id!,
      changes: { order: index + 1 }
    }));

    // Выполняем обновление в транзакции
    await bookDb.transaction('rw', bookDb.scenes, async () => {
      await Promise.all(
          updates.map(update =>
              bookDb.scenes.update(update.id, update.changes)
          )
      );
    });
  };

  return {
    scenes,
    deleteScene,
    reorderScenes,
    updateSceneOrder,
    createScene,
    updateScene
  };
};
