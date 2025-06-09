// src/hooks/useChapters.ts
// import { useLiveQuery } from "dexie-react-hooks"; // Potentially unused if chapters prop is the sole source
import { bookDb } from "@/entities/bookDb";
import { notifications } from "@mantine/notifications";
// import { arrayMove } from "@dnd-kit/sortable"; // This logic is now in ChapterRepository.reorderChapters
import { IChapter } from "@/entities/BookEntities";
import { ChapterRepository } from '@/repository/Scene/ChapterRepository';
import { SceneRepository } from '@/repository/Scene/SceneRepository';

export const useChapters = (chapters?: IChapter[]) => { // chapters prop is likely for display

  const createChapter = async (title: string) => {
    try {
      const chapterId = await ChapterRepository.create(bookDb, { title });
      if (chapterId === undefined) {
        throw new Error("Chapter creation failed to return an ID.");
      }
      notifications.show({
        title: "Успех",
        message: "Глава успешно создана", // "Chapter successfully created"
        color: "green",
      });
      return chapterId;
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось создать главу", // "Failed to create chapter"
        color: "red",
      });
      return undefined;
    }
  };

  const deleteChapter = async (chapterId: number) => {
    try {
      await ChapterRepository.remove(bookDb, chapterId);
      // ChapterRepository.remove handles unassigning scenes and calling SceneRepository.recalculateGlobalOrder
      notifications.show({
        title: "Успешно",
        message: "Глава удалена", // "Chapter deleted"
        color: "green"
      });
      return true;
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось удалить главу", // "Failed to delete chapter"
        color: "red"
      });
      return false;
    }
  };

  const updateChapterOrder = async (chapterId: number, newOrder: number) => {
    try {
      // Assuming ChapterRepository.update will call SceneRepository.recalculateGlobalOrder if order changes
      await ChapterRepository.update(bookDb, chapterId, { order: newOrder });
      notifications.show({
        title: "Успешно",
        message: "Порядок глав обновлен", // "Chapter order updated"
        color: "green"
      });
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось обновить порядок глав", // "Failed to update chapter order"
        color: "red"
      });
    }
  };

  const reorderChapters = async (activeId: number, overId: number) => {
    // The 'chapters' array prop is used by dnd-kit locally for UI,
    // but the actual reordering logic is now fully in the repository.
    try {
      await ChapterRepository.reorderChapters(bookDb, activeId, overId);
      // ChapterRepository.reorderChapters handles the transaction and calls SceneRepository.recalculateGlobalOrder
      notifications.show({
        title: "Успешно",
        message: "Порядок глав изменен", // "Chapter order changed"
        color: "green"
      });
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось изменить порядок глав", // "Failed to change chapter order"
        color: "red"
      });
    }
  };

  const addSceneToChapter = async (sceneId: number, chapterId: number) => {
    try {
      await SceneRepository.addSceneToChapter(bookDb, sceneId, chapterId);
      // SceneRepository.addSceneToChapter calls recalculateGlobalOrder
      notifications.show({
        title: "Успешно",
        message: "Сцена добавлена в главу", // "Scene added to chapter"
        color: "green"
      });
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось добавить сцену в главу", // "Failed to add scene to chapter"
        color: "red"
      });
    }
  };

  const removeSceneFromChapter = async (sceneId: number) => {
    try {
      await SceneRepository.removeSceneFromChapter(bookDb, sceneId);
      // SceneRepository.removeSceneFromChapter calls recalculateGlobalOrder
      notifications.show({
        title: "Успешно",
        message: "Сцена удалена из главы", // "Scene removed from chapter"
        color: "green"
      });
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось удалить сцену из главы", // "Failed to remove scene from chapter"
        color: "red"
      });
    }
  };

  const updateChapter = async (chapterId: number, title: string) => {
    try {
      await ChapterRepository.update(bookDb, chapterId, { title });
      notifications.show({
        title: "Успех",
        message: "Глава успешно обновлена", // "Chapter successfully updated"
        color: "green"
      })
    }
    catch(error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось обновить главу", // "Failed to update chapter"
        color: "red"
      })
    }
  }

  return {
    chapters, // This is the prop passed in
    createChapter,
    deleteChapter,
    reorderChapters,
    updateChapterOrder,
    addSceneToChapter,
    removeSceneFromChapter,
    updateChapter
  };
};
