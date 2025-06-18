import { notifications } from "@mantine/notifications";
import { IChapter } from "@/entities/BookEntities";
import { SceneService } from '@/services/sceneService';

export const useChapters = (chapters?: IChapter[]) => {

  const createChapter = async (title: string) => {
    const result = await SceneService.createChapter(title);
    if (result.success) {
      notifications.show({ title: 'Успех', message: 'Глава успешно создана', color: 'green' });
      return result.data;
    } else {
      notifications.show({ title: 'Ошибка', message: 'Не удалось создать главу', color: 'red' });
      return undefined;
    }
  };

  const deleteChapter = async (chapterId: number) => {
    const result = await SceneService.deleteChapter(chapterId);
    if (result.success) {
      notifications.show({ title: 'Успешно', message: 'Глава удалена', color: 'green' });
      return true;
    } else {
      notifications.show({ title: 'Ошибка', message: 'Не удалось удалить главу', color: 'red' });
      return false;
    }
  };

  const updateChapterOrder = async (chapterId: number, newOrder: number) => {
    const result = await SceneService.updateChapterOrder(chapterId, newOrder);
    if (result.success) {
      notifications.show({ title: 'Успешно', message: 'Порядок глав обновлен', color: 'green' });
    } else {
      notifications.show({ title: 'Ошибка', message: 'Не удалось обновить порядок глав', color: 'red' });
    }
  };

  const reorderChapters = async (activeId: number, overId: number) => {
    const result = await SceneService.reorderChapters(activeId, overId);
    if (result.success) {
      notifications.show({ title: 'Успешно', message: 'Порядок глав изменен', color: 'green' });
    } else {
      notifications.show({ title: 'Ошибка', message: 'Не удалось изменить порядок глав', color: 'red' });
    }
  };

  const addSceneToChapter = async (sceneId: number, chapterId: number) => {
    const result = await SceneService.addSceneToChapter(sceneId, chapterId);
    if (result.success) {
      notifications.show({ title: 'Успешно', message: 'Сцена добавлена в главу', color: 'green' });
    } else {
      notifications.show({ title: 'Ошибка', message: 'Не удалось добавить сцену в главу', color: 'red' });
    }
  };

  const removeSceneFromChapter = async (sceneId: number) => {
    const result = await SceneService.removeSceneFromChapter(sceneId);
    if (result.success) {
      notifications.show({ title: 'Успешно', message: 'Сцена удалена из главы', color: 'green' });
    } else {
      notifications.show({ title: 'Ошибка', message: 'Не удалось удалить сцену из главы', color: 'red' });
    }
  };

  const updateChapter = async (chapterId: number, title: string) => {
    const result = await SceneService.updateChapter(chapterId, title);
    if (result.success) {
      notifications.show({ title: 'Успех', message: 'Глава успешно обновлена', color: 'green' });
    } else {
      notifications.show({ title: 'Ошибка', message: 'Не удалось обновить главу', color: 'red' });
    }
  };

  return {
    chapters,
    createChapter,
    deleteChapter,
    reorderChapters,
    updateChapterOrder,
    addSceneToChapter,
    removeSceneFromChapter,
    updateChapter,
  };
};
