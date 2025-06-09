import { bookDb } from "@/entities/bookDb";
import { notifications } from "@mantine/notifications";
import { IScene } from "@/entities/BookEntities";
import { useLiveQuery } from "dexie-react-hooks";
import { SceneRepository } from '@/repository/Scene/SceneRepository';

export const useSceneEditor = (sceneIdProp?: number) => {
  // Use a stable variable for Dexie's liveQuery dependency array,
  // and to differentiate from the potential id from the fetched scene object.
  const currentSceneIdFromProp = sceneIdProp;

  const scene: IScene | undefined = useLiveQuery<IScene | undefined>(() => {
    if (currentSceneIdFromProp === undefined || currentSceneIdFromProp === null) {
      return undefined; // No ID, so no scene to fetch (e.g., for a new scene)
    }
    return SceneRepository.getById(bookDb, Number(currentSceneIdFromProp));
  }, [currentSceneIdFromProp]);

  const saveScene = async (dataToSave: IScene, silent: boolean = false) => {
    let newOrUpdatedSceneId: number | undefined;
    try {
      // Determine if we are creating a new scene or updating an existing one.
      // A scene is new if no sceneIdProp was provided initially,
      // or if sceneIdProp was provided but the scene object from DB is still undefined (e.g. invalid ID was passed).
      // However, the most robust way is to check if `scene` (from DB) has an id, or if `currentSceneIdFromProp` indicates an existing record.
      // If currentSceneIdFromProp is set, we assume we are updating. Otherwise, creating.

      if (currentSceneIdFromProp === undefined || currentSceneIdFromProp === null) { // Logic for creating a new scene
        // `SceneRepository.create` will handle setting default order and recalculating global order.
        // Ensure dataToSave does not include an 'id' property if it's meant to be new.
        const sceneDataForCreation = { ...dataToSave };
        delete (sceneDataForCreation as any).id; // Remove id if present

        newOrUpdatedSceneId = await SceneRepository.create(bookDb, sceneDataForCreation);
        if (!silent && newOrUpdatedSceneId !== undefined) {
          notifications.show({
            title: "Успех",
            message: "Сцена успешно создана", // "Scene successfully created"
            color: "green",
          });
        }
      } else { // Logic for updating an existing scene
        // scene?.id should match currentSceneIdFromProp if the scene was fetched successfully
        const sceneIdToUpdate = Number(currentSceneIdFromProp);

        // SceneRepository.update expects Partial<IScene>.
        // dataToSave could be a full IScene object from a form.
        // We pass it as is; the repository's update method handles Partial aspects.
        // The updated SceneRepository.update will handle recalculateGlobalOrder if order/chapterId changes.
        await SceneRepository.update(bookDb, sceneIdToUpdate, dataToSave);
        newOrUpdatedSceneId = sceneIdToUpdate; // update in repo doesn't return id, so use existing

        if (!silent) {
          notifications.show({
            title: "Успех",
            message: "Сцена успешно обновлена", // "Scene successfully updated"
            color: "green",
          });
        }
      }
    } catch (error) {
      console.error("Error saving scene:", error);
      notifications.show({
        title: "Ошибка",
        message: "Не удалось сохранить сцену", // "Failed to save scene"
        color: "red",
      });
      // newOrUpdatedSceneId remains undefined in case of an error
    }
    return newOrUpdatedSceneId; // Return the ID of the created/updated scene
  }

  return {
    scene,
    saveScene
  }
}
