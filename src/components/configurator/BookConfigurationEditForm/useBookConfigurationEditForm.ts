import {useLiveQuery} from 'dexie-react-hooks';
import {
  IBlock,
  IBlockParameterGroup,
  IBookConfiguration,
  IBookConfigurationVersion
} from "@/entities/ConstructorEntities";
import {configDatabase} from "@/entities/condiguratorDb";
import {generateUUID} from "@/utils/UUIDUtils";

export const useBookConfigurationEditForm = (configurationUuid: string,
                                             currentVersion?: IBookConfigurationVersion,
                                             currentBlock?: IBlock) => {

  // Данные конфигурации
  const configuration  = useLiveQuery<IBookConfiguration>(() => {
    return configDatabase.bookConfigurations.where("uuid").equals(configurationUuid).first();
  }, [configurationUuid]);

  const versionList = useLiveQuery(async () => {
    return configDatabase.configurationVersions.where("configurationUuid").equals(configurationUuid).toArray()
  }, [configurationUuid, configuration])

  // Список строительных блоков конфигурации
  const blockList = useLiveQuery<IBlock[]>(() => {
    if (!currentVersion) {
      return []
    }
    return configDatabase.blocks.where('configurationVersionUuid').equals(currentVersion?.uuid).toArray();
  }, [currentVersion])

  // Список групп параметров для строительного блока
  const paramGroupList = useLiveQuery<IBlockParameterGroup[]>(() => {
    if (!currentVersion || !currentBlock) {
      return []
    }
    return configDatabase.blockParameterGroups.where('blockUuid').equals(currentBlock?.uuid).toArray();
  }, [currentBlock])

  //Создание новой версии конфигурации
  const publishVersion = async () => {
    if (!configuration) return;
    await configDatabase.configurationVersions.update(currentVersion?.id, {isDraft: false});

    const nextVersionNumber = versionList?.length > 0
        ? Math.max(...versionList?.map(v => v.versionNumber)) + 1
        : 1;

    const newVersion: IBookConfigurationVersion = {
      uuid: generateUUID(),
      configurationUuid,
      versionNumber: nextVersionNumber,
      isDraft: true
    };

    const newVersionId = await configDatabase.configurationVersions.add(newVersion);
    return {...newVersion, id: newVersionId};
  };

  const appendDefaultParamGroup = async (blockData: IBlock) => {
    await configDatabase.blockParameterGroups.add({
      blockUuid: blockData.uuid,
      uuid: generateUUID(),
      orderNumber: 0,
      description: '',
      title: 'Основное'
    })
  }
  const saveBlock = async (blockData: IBlock) => {
    if (!blockData.uuid) {
      blockData.uuid = generateUUID()
      const blockId = await configDatabase.blocks.add(blockData)
      const persistedBlockData = await configDatabase.blocks.get(blockId)
      await appendDefaultParamGroup(persistedBlockData)
      return
    }
    configDatabase.blocks.update(blockData.id, blockData)
  }

  return {
    configuration,
    createNewVersion: publishVersion,
    versionList,
    blockList,
    paramGroupList,
    saveBlock
  }
}
