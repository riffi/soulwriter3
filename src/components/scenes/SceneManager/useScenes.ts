
import { bookDb } from "@/entities/bookDb";
import { IScene } from "@/entities/BookEntities";
import { notifications } from "@mantine/notifications";
// IBlock, ISceneWithInstances, liveQuery, useLiveQuery seem unused in the refactored hook logic
// If they are used by the component consuming the hook for other purposes, they should remain.
// For now, focusing on the provided hook code.
import { SceneRepository } from '@/repository/Scene/SceneRepository';

export const useScenes = (scenes?: IScene[]) => { // scenes prop is likely for display, not modified here

  const createScene = async (title: string, chapterId?: number) => {
    const newSceneData: IScene = {
      title,
      body: "", // Default body
      order: 0, // Will be correctly set by SceneRepository.create via recalculateGlobalOrder
      chapterId: chapterId ?? null,
      // id is not needed here, will be auto-generated
    };

    try {
      const sceneId = await SceneRepository.create(bookDb, newSceneData);
      if (sceneId === undefined) {
        throw new Error("Scene creation failed to return an ID.");
      }
      notifications.show({
        title: "Успешно",
        message: "Сцена создана", // "Scene created"
        color: "green"
      });
      return sceneId;
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось создать сцену", // "Failed to create scene"
        color: "red"
      });
      // Optionally re-throw or return a specific error indicator
      return undefined;
    }
  }

  const deleteScene = async (sceneId: number) => {
    try {
      await SceneRepository.remove(bookDb, sceneId);
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
      await SceneRepository.updateOrder(bookDb, sceneId, newOrder);
      // Notification might be redundant if UI updates automatically and recalculateGlobalOrder ensures consistency.
      // However, explicit feedback can be good.
      notifications.show({
        title: "Успешно",
        message: "Порядок сцен обновлен", // "Scene order updated"
        color: "green"
      });
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось обновить порядок сцен",
        color: "red"
      });
    }
  };

  const updateScene = async (sceneId: number, sceneData: Partial<IScene>) => { // Changed to Partial<IScene> for flexibility
    try {
      await SceneRepository.update(bookDb, sceneId, sceneData);
      notifications.show({
        title: "Успешно",
        message: "Сцена обновлена", // "Scene updated"
        color: "green"
      });
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось обновить сцену", // "Failed to update scene"
        color: "red"
      });
    }
  }

  const reorderScenes = async (activeId: number, overId: number) => {
    try {
      await SceneRepository.swapOrder(bookDb, activeId, overId);
      // swapOrder in repository now calls recalculateGlobalOrder, so UI should reflect the change.
      notifications.show({
        title: "Успешно",
        message: "Порядок сцен изменен", // "Scene order changed"
        color: "green"
      });
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось изменить порядок сцен", // "Failed to reorder scenes"
        color: "red"
      });
    }
  };

  // recalculateGlobalOrder function is removed from here, as its logic is in SceneRepository.

  return {
    scenes, // This is the prop passed in, returned for convenience
    deleteScene,
    reorderScenes,
    updateSceneOrder,
    createScene,
    updateScene,
    // recalculateGlobalOrder is no longer exported from this hook
  };
};
