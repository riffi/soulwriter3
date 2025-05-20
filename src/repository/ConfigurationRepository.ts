import {BlockAbstractDb} from "@/entities/BlockAbstractDb";
import {configDatabase} from "@/entities/configuratorDb";

const getByUuid = async (db: BlockAbstractDb, uuid?: string) => {
  if (!uuid) return
  return db.bookConfigurations.where("uuid").equals(uuid).first();
}

const getExportData = async (db: BlockAbstractDb, configurationUuid: string) => {
  // Вспомогательная функция для удаления id
  const excludeId = <T extends {id?: number}>(obj: T): Omit<T, 'id'> => {
    const {id, ...rest} = obj;
    return rest;
  };

  const config = await db.bookConfigurations
  .where("uuid").equals(configurationUuid).first();

  if (!config) return null;


  const blocks = (await db.blocks
  .where("configurationUuid").equals(configurationUuid).toArray())
  .map(excludeId);

  const groups = (await db.blockParameterGroups
  .where("blockUuid").anyOf(blocks.map(b => b.uuid)).toArray())
  .map(excludeId);

  const parameters = (await db.blockParameters
  .where("groupUuid").anyOf(groups.map(g => g.uuid)).toArray())
  .map(excludeId);

  const possibleValues = (await db.blockParameterPossibleValues
  .where("parameterUuid").anyOf(parameters.map(p => p.uuid)).toArray())
  .map(excludeId);

  const relations = (await db.blocksRelations
  .where("configurationUuid").equals(configurationUuid).toArray())
  .map(excludeId);

  const tabs = (await db.blockTabs
  .where("blockUuid").anyOf(blocks.map(b => b.uuid)).toArray())
  .map(excludeId);

  return {
    configuration: excludeId(config), // Исключаем id у основной конфигурации
    blocks,
    parameterGroups: groups,
    parameters,
    possibleValues,
    relations,
    tabs,
  };
};

export const ConfigurationRepository = {
  getByUuid,
  getExportData
}
