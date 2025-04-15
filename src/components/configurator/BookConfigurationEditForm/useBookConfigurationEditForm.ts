import {useLiveQuery} from 'dexie-react-hooks';
import {
  IBlock, IBlockParameter, IBlockParameterDataType,
  IBlockParameterGroup, IBlockParameterPossibleValue,
  IBookConfiguration,
  IBookConfigurationVersion
} from "@/entities/ConstructorEntities";
import {configDatabase} from "@/entities/configuratorDb";
import {generateUUID} from "@/utils/UUIDUtils";
import {fetchAndPrepareTitleForms} from "@/api/TextApi";

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
    if (!configuration || !currentVersion) return;

    // Помечаем текущую версию как опубликованную
    await configDatabase.configurationVersions.update(currentVersion.id, { isDraft: false });

    // Создаем новую версию
    const nextVersionNumber = versionList?.length > 0
        ? Math.max(...versionList?.map(v => v.versionNumber)) + 1
        : 1;

    const newVersion: IBookConfigurationVersion = {
      uuid: generateUUID(),
      configurationUuid,
      versionNumber: nextVersionNumber,
      isDraft: true
    };

    // Добавляем новую версию и получаем её ID
    const newVersionId = await configDatabase.configurationVersions.add(newVersion);
    const persistedNewVersion = { ...newVersion, id: newVersionId };

    // Копируем все блоки из текущей версии в новую
    const blocks = await configDatabase.blocks
    .where('configurationVersionUuid')
    .equals(currentVersion.uuid)
    .toArray();

    for (const block of blocks) {
      // Сохраняем оригинальный UUID блока для поиска групп параметров
      const originalBlockUuid = block.uuid;

      // Создаем копию блока с новой версией
      const newBlock: IBlock = {
        ...block,
        id: undefined,
        uuid: generateUUID(),
        configurationVersionUuid: newVersion.uuid
      };

      // Добавляем новый блок и получаем его ID
      const newBlockId = await configDatabase.blocks.add(newBlock);
      const persistedNewBlock = await configDatabase.blocks.get(newBlockId);

      // Копируем группы параметров для этого блока
      const paramGroups = await configDatabase.blockParameterGroups
      .where('blockUuid')
      .equals(originalBlockUuid)
      .toArray();

      for (const group of paramGroups) {
        // Сохраняем оригинальный UUID группы для поиска параметров
        const originalGroupUuid = group.uuid;

        // Создаем копию группы с новым блоком
        const newGroup: IBlockParameterGroup = {
          ...group,
          id: undefined,
          uuid: generateUUID(),
          blockUuid: persistedNewBlock?.uuid
        };

        // Добавляем новую группу и получаем её ID
        const newGroupId = await configDatabase.blockParameterGroups.add(newGroup);
        const persistedNewGroup = await configDatabase.blockParameterGroups.get(newGroupId);

        // Копируем параметры для этой группы
        const parameters = await configDatabase.blockParameters
        .where('groupUuid')
        .equals(originalGroupUuid)
        .toArray();

        for (const param of parameters) {
          // Создаем копию параметра с новой группой
          const newParam: IBlockParameter = {
            ...param,
            id: undefined,
            uuid: generateUUID(),
            groupUuid: persistedNewGroup?.uuid
          };

          // Добавляем новый параметр и получаем его ID
          const newParamId = await configDatabase.blockParameters.add(newParam);
          const persistedNewParam = await configDatabase.blockParameters.get(newParamId);

          // Если параметр имеет тип dropdown, копируем возможные значения
          if (param.dataType === IBlockParameterDataType.dropdown) {
            const possibleValues = await configDatabase.blockParameterPossibleValues
            .where('parameterUuid')
            .equals(param.uuid)
            .toArray();

            for (const value of possibleValues) {
              const newValue: IBlockParameterPossibleValue = {
                ...value,
                id: undefined,
                uuid: generateUUID(),
                parameterUuid: persistedNewParam?.uuid
              };
              await configDatabase.blockParameterPossibleValues.add(newValue);
            }
          }
        }
      }
    }

    return persistedNewVersion;
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
    blockData.titleForms = await fetchAndPrepareTitleForms(blockData.title)
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
    publishVersion,
    versionList,
    blockList,
    paramGroupList,
    saveBlock
  }
}
