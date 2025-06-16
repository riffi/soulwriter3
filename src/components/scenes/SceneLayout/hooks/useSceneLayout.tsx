import {useLiveQuery} from "dexie-react-hooks";
import {bookDb} from "@/entities/bookDb";
import {IBlock} from "@/entities/ConstructorEntities";
import {IScene, ISceneWithInstances} from "@/entities/BookEntities";
import {SceneRepository} from "@/repository/Scene/SceneRepository";
import {ChapterRepository} from "@/repository/Scene/ChapterRepository";
import {BlockRepository} from "@/repository/Block/BlockRepository";
import {BlockInstanceRepository} from "@/repository/BlockInstance/BlockInstanceRepository";
import {BlockInstanceSceneLinkRepository} from "@/repository/BlockInstance/BlockInstanceSceneLinkRepository";

export const useSceneLayout = () => {
  const scenes = useLiveQuery(() => SceneRepository.getAll(bookDb), [])
  const chapters = useLiveQuery(() => ChapterRepository.getAll(bookDb), [])

  const getLinkedBlockInstances = async (sceneId: number) => {
    const links = await BlockInstanceSceneLinkRepository.getLinksBySceneId(bookDb, sceneId);

    const blockUuids = Array.from(new Set(links.map(l => l.blockUuid)));
    const instanceUuids = links.map(l => l.blockInstanceUuid);

    const [blocks, instances] = await Promise.all([
      Promise.all(blockUuids.map(uuid =>
          BlockRepository.getByUuid(bookDb, uuid)
      )),
      Promise.all(instanceUuids.map(uuid =>
          BlockInstanceRepository.getByUuid(bookDb, uuid)
      )).then(arr => arr.flat())
    ]);

    // Фильтруем блоки по showInSceneList === 1
    const filteredBlocks = blocks.filter((b): b is IBlock =>
        !!b && b.showInSceneList === 1
    );

    const result = filteredBlocks.map(block => ({
      block,
      instances: instances.filter(instance =>
          links.some(l =>
              l.blockUuid === block.uuid &&
              l.blockInstanceUuid === instance.uuid
          )
      )
    }));

    return result.filter(group => group.instances.length > 0);
  };

  const getScenesWithBlockInstances = async (scenesToShow?: IScene[]): Promise<ISceneWithInstances[]> => {
    if (!scenesToShow) return [];
    return Promise.all(
        scenesToShow?.map(async (scene) => ({
          ...scene,
          blockInstances: await getLinkedBlockInstances(scene.id!),
        }))
    );
  };

  return {
    scenes,
    chapters,
    getScenesWithBlockInstances
  }
}
