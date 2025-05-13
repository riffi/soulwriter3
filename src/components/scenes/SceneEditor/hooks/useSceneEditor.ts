import { bookDb } from "@/entities/bookDb";
import { notifications } from "@mantine/notifications";
import { IScene } from "@/entities/BookEntities";
import { useLiveQuery } from "dexie-react-hooks";

export const useSceneEditor = (sceneId?: number) => {
  const scene: IScene | undefined = useLiveQuery<IScene>(async () => {
    if (!sceneId) {
      // Для новой сцены устанавливаем порядок как последний + 1
      const lastScene = await bookDb.scenes.orderBy('order').last();
      const newOrder = lastScene ? lastScene.order + 1 : 1;
      return { body: "", title: "Новая сцена", order: newOrder };
    }
    return bookDb.scenes.get(Number(sceneId));
  }, [sceneId]);

  const saveScene = async (dataToSave: IScene, silent: boolean = false) => {
    let sceneId = scene?.id;
    try {
      if (!sceneId) {
        // Для новой сцены убедимся, что порядковый номер установлен
        if (!dataToSave.order) {
          const lastScene = await bookDb.scenes.orderBy('order').last();
          dataToSave.order = lastScene ? lastScene.order + 1 : 1;
        }
        sceneId = await bookDb.scenes.add(dataToSave);
        if (!silent) {
          notifications.show({
            title: "Успех",
            message: "Сцена успешно создана",
            color: "green",
          });
        }
      } else {
        // При обновлении сохраняем текущий порядок, если он не был изменен
        const existingScene = await bookDb.scenes.get(Number(sceneId));
        const updatedData = {
          ...dataToSave,
          order: dataToSave.order || existingScene?.order || 1
        };
        sceneId = await bookDb.scenes.update(Number(sceneId), updatedData);
        if (!silent) {
          notifications.show({
            title: "Успех",
            message: "Сцена успешно обновлена",
            color: "green",
          });
        }
      }
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось сохранить сцену",
        color: "red",
      });
    }
    return sceneId;
  }

  return {
    scene,
    saveScene
  }
}
