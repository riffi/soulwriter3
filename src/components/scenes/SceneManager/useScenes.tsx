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
    const newScene: IScene = {
      title,
      body: "",
      order: 0, // Временное значение
      chapterId: chapterId ?? null
    };

    const sceneId = await bookDb.scenes.add(newScene);

    // Вызываем пересчет порядка
    await recalculateGlobalOrder({
      id: sceneId,
      newChapterId: chapterId ?? null
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
    const allScenes = await bookDb.scenes.orderBy('order').toArray();

    const activeIndex = allScenes.findIndex(s => s.id === activeId);
    const overIndex = allScenes.findIndex(s => s.id === overId);

    if (activeIndex === -1 || overIndex === -1) return;

    const newScenes = arrayMove(allScenes, activeIndex, overIndex);

    // Используем новую логику пересчета
    await recalculateGlobalOrder();
  };

  const recalculateGlobalOrder = async (
      movedScene?: { id: number; newChapterId: number | null }
  ) => {
    // Получаем все сцены в текущем порядке
    const allScenes = await bookDb.scenes.orderBy('order').toArray();

    // Если есть перемещаемая сцена - временно удаляем ее из общего списка
    let movedSceneData: IScene | undefined;
    if (movedScene) {
      movedSceneData = allScenes.find(s => s.id === movedScene.id);
      if (movedSceneData) {
        allScenes.splice(allScenes.indexOf(movedSceneData), 1);
      }
    }

    // Определяем целевую группу для перемещенной сцены
    const targetGroup = movedScene
        ? allScenes.filter(s => s.chapterId === movedScene.newChapterId)
        : [];

    // Вставляем перемещенную сцену в конец целевой группы
    if (movedSceneData && movedScene) {
      movedSceneData.chapterId = movedScene.newChapterId;
      const insertIndex = targetGroup.length > 0
          ? allScenes.indexOf(targetGroup[targetGroup.length - 1]) + 1
          : allScenes.length;

      allScenes.splice(insertIndex, 0, movedSceneData);
    }

    // Обновляем порядковые номера для всех сцен
    await bookDb.transaction('rw', bookDb.scenes, async () => {
      for (let i = 0; i < allScenes.length; i++) {
        await bookDb.scenes.update(allScenes[i].id!, {
          order: i + 1,
          chapterId: allScenes[i].chapterId
        });
      }
    });
  };

  return {
    scenes,
    deleteScene,
    reorderScenes,
    updateSceneOrder,
    createScene,
    updateScene,
    recalculateGlobalOrder
  };
};
