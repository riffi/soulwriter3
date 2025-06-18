import { useLiveQuery } from "dexie-react-hooks";
import { bookDb } from "@/entities/bookDb";
import { BlockInstanceSceneLinkRepository } from "@/repository/BlockInstance/BlockInstanceSceneLinkRepository";
import { IBlock } from "@/entities/ConstructorEntities";
import { IBlockInstance, IBlockInstanceSceneLink } from "@/entities/BookEntities";

export const useSceneLinks = (sceneId: number) => {
    const blocks = useLiveQuery<IBlock[]>(() =>
        bookDb.blocks.where("sceneLinkAllowed").equals(1).toArray(), [sceneId]);

    const links = useLiveQuery<IBlockInstanceSceneLink[]>(() =>
        BlockInstanceSceneLinkRepository.getLinksBySceneId(bookDb, sceneId), [sceneId]);

    const blockInstances = useLiveQuery<IBlockInstance[]>(() =>
        bookDb.blockInstances.toArray(), [sceneId]);

    return { blocks, links, blockInstances };
};
