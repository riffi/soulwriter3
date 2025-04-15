import {generateUUID} from "@/utils/UUIDUtils";
import {
  IBlock, IBlockParameter, IBlockParameterDataType, IBlockParameterGroup,
  IBlockParameterPossibleValue,
  IBookConfiguration,
  IBookConfigurationVersion
} from "@/entities/ConstructorEntities";
import {configDatabase} from "@/entities/configuratorDb";


export const usePublishVersion = (
    configurationUuid: string,
    configuration: IBookConfiguration,
    currentVersion: IBookConfigurationVersion,
    versionList: IBookConfigurationVersion[],
) => {
  // Пометить текущую версию как опубликованную
  const markVersionAsPublished = async (versionId: number) => {
    await configDatabase.configurationVersions.update(versionId, { isDraft: false });
  };

// Получить следующий номер версии
  const getNextVersionNumber = (versions: IBookConfigurationVersion[] | undefined) => {
    return versions?.length > 0
        ? Math.max(...versions.map(v => v.versionNumber)) + 1
        : 1;
  };

// Создать новую версию конфигурации
  const createNewVersion = async (configUuid: string, nextVersionNumber: number) => {
    const newVersion: IBookConfigurationVersion = {
      uuid: generateUUID(),
      configurationUuid: configUuid,
      versionNumber: nextVersionNumber,
      isDraft: true
    };

    const newVersionId = await configDatabase.configurationVersions.add(newVersion);
    return { ...newVersion, id: newVersionId };
  };

// Копировать блоки из текущей версии в новую
  const copyBlocksToNewVersion = async (currentVersionUuid: string, newVersionUuid: string) => {
    const blocks = await configDatabase.blocks
    .where('configurationVersionUuid')
    .equals(currentVersionUuid)
    .toArray();

    for (const block of blocks) {
      await copyBlockWithParameters(block, newVersionUuid);
    }
  };

// Копировать блок с его параметрами и группами
  const copyBlockWithParameters = async (block: IBlock, newVersionUuid: string) => {
    const originalBlockUuid = block.uuid;
    const newBlock = await createNewBlock(block, newVersionUuid);

    const paramGroups = await configDatabase.blockParameterGroups
    .where('blockUuid')
    .equals(originalBlockUuid)
    .toArray();

    for (const group of paramGroups) {
      await copyParameterGroupWithParameters(group, newBlock.uuid);
    }
  };

// Создать новый блок
  const createNewBlock = async (block: IBlock, newVersionUuid: string) => {
    const newBlock: IBlock = {
      ...block,
      id: undefined,
      uuid: generateUUID(),
      configurationVersionUuid: newVersionUuid
    };

    const newBlockId = await configDatabase.blocks.add(newBlock);
    const persistedNewBlock = await configDatabase.blocks.get(newBlockId);
    return persistedNewBlock!;
  };

// Копировать группу параметров с параметрами
  const copyParameterGroupWithParameters = async (group: IBlockParameterGroup, newBlockUuid: string) => {
    const originalGroupUuid = group.uuid;
    const newGroup = await createNewParameterGroup(group, newBlockUuid);

    const parameters = await configDatabase.blockParameters
    .where('groupUuid')
    .equals(originalGroupUuid)
    .toArray();

    for (const param of parameters) {
      await copyParameterWithPossibleValues(param, newGroup.uuid);
    }
  };

// Создать новую группу параметров
  const createNewParameterGroup = async (group: IBlockParameterGroup, newBlockUuid: string) => {
    const newGroup: IBlockParameterGroup = {
      ...group,
      id: undefined,
      uuid: generateUUID(),
      blockUuid: newBlockUuid
    };

    const newGroupId = await configDatabase.blockParameterGroups.add(newGroup);
    const persistedNewGroup = await configDatabase.blockParameterGroups.get(newGroupId);
    return persistedNewGroup!;
  };

// Копировать параметр с возможными значениями (для dropdown)
  const copyParameterWithPossibleValues = async (param: IBlockParameter, newGroupUuid: string) => {
    const newParam = await createNewParameter(param, newGroupUuid);

    if (param.dataType === IBlockParameterDataType.dropdown) {
      await copyPossibleValues(param.uuid, newParam.uuid);
    }
  };

// Создать новый параметр
  const createNewParameter = async (param: IBlockParameter, newGroupUuid: string) => {
    const newParam: IBlockParameter = {
      ...param,
      id: undefined,
      uuid: generateUUID(),
      groupUuid: newGroupUuid
    };

    const newParamId = await configDatabase.blockParameters.add(newParam);
    const persistedNewParam = await configDatabase.blockParameters.get(newParamId);
    return persistedNewParam!;
  };

// Копировать возможные значения параметра
  const copyPossibleValues = async (originalParamUuid: string, newParamUuid: string) => {
    const possibleValues = await configDatabase.blockParameterPossibleValues
    .where('parameterUuid')
    .equals(originalParamUuid)
    .toArray();

    for (const value of possibleValues) {
      const newValue: IBlockParameterPossibleValue = {
        ...value,
        id: undefined,
        uuid: generateUUID(),
        parameterUuid: newParamUuid
      };
      await configDatabase.blockParameterPossibleValues.add(newValue);
    }
  };

// Основная функция - создание новой версии конфигурации
  const publishVersion = async () => {
    if (!configuration || !currentVersion) return;

    await markVersionAsPublished(currentVersion.id);

    const nextVersionNumber = getNextVersionNumber(versionList);
    const newVersion = await createNewVersion(configurationUuid, nextVersionNumber);

    await copyBlocksToNewVersion(currentVersion.uuid, newVersion.uuid);

    return newVersion;
  };

  return{
    publishVersion
  }
}
