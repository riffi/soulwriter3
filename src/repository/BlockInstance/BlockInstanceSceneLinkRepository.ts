import { BookDB } from "@/entities/bookDb";
import { IBlockInstanceSceneLink } from "@/entities/BookEntities";

export const getLinksBySceneId = async (db: BookDB, sceneId: number) => {
  return db.blockInstanceSceneLinks
    .where('sceneId')
    .equals(sceneId)
    .toArray();
};

export const getLinksByBlockInstance = async (
  db: BookDB,
  blockInstanceUuid: string
) => {
  return db.blockInstanceSceneLinks
    .where('blockInstanceUuid')
    .equals(blockInstanceUuid)
    .toArray();
};

export const createLink = async (db: BookDB, link: IBlockInstanceSceneLink) => {
  await db.blockInstanceSceneLinks.add(link);
};

export const getAllLinks = async (db: BookDB) => {
  return db.blockInstanceSceneLinks.toArray();
};

export const updateLink = async (
  db: BookDB,
  id: number,
  changes: Partial<IBlockInstanceSceneLink>
) => {
  await db.blockInstanceSceneLinks.update(id, changes);
};

export const deleteLink = async (db: BookDB, id: number) => {
  await db.blockInstanceSceneLinks.delete(id);
};

export const removeLinksForScene = async (db: BookDB, sceneId: number) => {
  await db.blockInstanceSceneLinks.where('sceneId').equals(sceneId).delete();
};

export const removeLinksForInstance = async (
  db: BookDB,
  blockInstanceUuid: string
) => {
  await db.blockInstanceSceneLinks
    .where('blockInstanceUuid')
    .equals(blockInstanceUuid)
    .delete();
};

export const bulkAddLinks = async (
  db: BookDB,
  links: IBlockInstanceSceneLink[]
) => {
  if (links.length > 0) {
    await db.blockInstanceSceneLinks.bulkAdd(links);
  }
};

export const BlockInstanceSceneLinkRepository = {
  getLinksBySceneId,
  getLinksByBlockInstance,
  createLink,
  getAllLinks,
  updateLink,
  deleteLink,
  removeLinksForScene,
  removeLinksForInstance,
  bulkAddLinks,
};

export default BlockInstanceSceneLinkRepository;
