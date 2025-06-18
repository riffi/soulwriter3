import {BlockAbstractDb} from "@/entities/BlockAbstractDb";
import {IKnowledgeBasePage} from "@/entities/KnowledgeBaseEntities";
import {generateUUID} from "@/utils/UUIDUtils";

const getByUuid = async (db: BlockAbstractDb, uuid: string) => {
  return db.knowledgeBasePages.where('uuid').equals(uuid).first();
};

const getAll = async (db: BlockAbstractDb) => {
  return db.knowledgeBasePages.toArray();
};

const create = async (db: BlockAbstractDb, page: IKnowledgeBasePage) => {
  const data: IKnowledgeBasePage = {
    ...page,
    uuid: page.uuid || generateUUID(),
  };
  const id = await db.knowledgeBasePages.add(data);
  return { ...data, id };
};

const update = async (db: BlockAbstractDb, page: IKnowledgeBasePage) => {
  if (!page.id) {
    const existing = await getByUuid(db, page.uuid!);
    if (existing) page.id = existing.id;
  }
  await db.knowledgeBasePages.put(page);
  return page;
};

const save = async (db: BlockAbstractDb, page: IKnowledgeBasePage) => {
  if (!page.uuid) {
    return create(db, page);
  }
  const existing = await getByUuid(db, page.uuid);
  if (existing) {
    return update(db, { ...existing, ...page });
  }
  return create(db, page);
};

const remove = async (db: BlockAbstractDb, uuid: string) => {
  await db.knowledgeBasePages.where('uuid').equals(uuid).delete();
};

export const KnowledgeBaseRepository = {
  getByUuid,
  getAll,
  create,
  update,
  save,
  remove,
};
