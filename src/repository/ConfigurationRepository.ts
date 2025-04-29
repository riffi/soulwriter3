import {BlockAbstractDb} from "@/entities/BlockAbstractDb";

const getByUuid = async (db: BlockAbstractDb, uuid?: string) => {
  if (!uuid) return
  return db.bookConfigurations.where("uuid").equals(uuid).first();
}


const getVersion = async (db: BlockAbstractDb, uuid?: string) => {
  if (!uuid) return
  return db.configurationVersions.where("uuid").equals(uuid).first();
}


export const ConfigurationRepository = {
  getByUuid,
  getVersion
}
