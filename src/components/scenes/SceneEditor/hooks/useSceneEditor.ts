import { notifications } from "@mantine/notifications";
import { IScene } from "@/entities/BookEntities";
import { useLiveQuery } from "dexie-react-hooks";
import { bookDb } from "@/entities/bookDb";
import { SceneRepository } from '@/repository/Scene/SceneRepository';
import { SceneService } from '@/services/sceneService';

export const useSceneEditor = (sceneIdProp?: number) => {
  const currentSceneIdFromProp = sceneIdProp;

  const scene: IScene | undefined = useLiveQuery<IScene | undefined>(() => {
    if (currentSceneIdFromProp === undefined || currentSceneIdFromProp === null) {
      return undefined;
    }
    return SceneRepository.getById(bookDb, Number(currentSceneIdFromProp));
  }, [currentSceneIdFromProp]);

  const saveScene = async (dataToSave: IScene, silent = false) => {
    const result = await SceneService.saveScene(currentSceneIdFromProp, dataToSave);
    if (result.success) {
      if (!silent) {
        notifications.show({
          title: 'Успех',
          message: currentSceneIdFromProp ? 'Сцена успешно обновлена' : 'Сцена успешно создана',
          color: 'green',
        });
      }
      return result.data;
    }
    notifications.show({ title: 'Ошибка', message: 'Не удалось сохранить сцену', color: 'red' });
    return undefined;
  };

  return {
    scene,
    saveScene,
  };
};
