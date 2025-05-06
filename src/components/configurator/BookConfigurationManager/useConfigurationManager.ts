import {useLiveQuery} from "dexie-react-hooks";
import { generateUUID } from '@/utils/UUIDUtils';
import {IBookConfiguration} from "@/entities/ConstructorEntities";
import {configDatabase} from "@/entities/configuratorDb";
import {useDialog} from "@/providers/DialogProvider/DialogProvider";
import {notifications} from "@mantine/notifications";
export const useConfigurationManager = () => {
  const { showDialog } = useDialog();

  const configurationList = useLiveQuery<IBookConfiguration[]>(async () => {
    return configDatabase.bookConfigurations.toArray();
  }, [])

  const saveConfiguration = async (configuration: IBookConfiguration) => {
    // Если конфигурация уже существует, обновляем ее
    if (configuration.uuid){
      await configDatabase.bookConfigurations.update(configuration.id, configuration)
      return
    }

    // Если это новая конфигурация, добавляем ее
    configuration.uuid = generateUUID()
    const configurationId = await configDatabase.bookConfigurations.put(configuration)

    // Создаем черновик первой версии конфигурации
    await configDatabase.configurationVersions.add({
      uuid: generateUUID(),
      configurationUuid: configuration.uuid,
      versionNumber: 1,
      isDraft: 1,
    })
  }

  const removeConfiguration = async (configuration: IBookConfiguration) => {
    const result = await showDialog("Внимание", "Вы уверены, что хотите удалить конфигурацию?")
    if (!result){
      return
    }
    const versions = await configDatabase
      .configurationVersions
      .where({configurationUuid: configuration.uuid})
      .toArray()

    const blocks = await configDatabase
      .blocks
      .where('configurationVersionUuid')
      .anyOf(versions.map(v => v.uuid))
      .toArray()

    const paramGroups = await configDatabase
      .blockParameterGroups
      .where('blockUuid')
      .anyOf(blocks.map(b => b.uuid))
      .toArray()

    const parameters = await configDatabase
      .blockParameters
      .where('groupUuid')
      .anyOf(paramGroups.map(pg => pg.uuid))
      .toArray()

    const paramsPossibleValues = await configDatabase
        .blockParameterPossibleValues
        .where('parameterUuid')
        .anyOf(parameters.map(p => p.uuid))
        .toArray()
    const blockTabs = await configDatabase
        .blockTabs
        .where('blockUuid')
        .anyOf(blocks.map(b => b.uuid))
        .toArray()

    await configDatabase.blockParameterPossibleValues.bulkDelete(paramsPossibleValues.map(pv => pv.id))
    await configDatabase.blockParameters.bulkDelete(parameters.map(p => p.id))
    await configDatabase.blockParameterGroups.bulkDelete(paramGroups.map(pg => pg.id))
    await configDatabase.blocks.bulkDelete(blocks.map(b => b.id))
    await configDatabase.blockTabs.bulkDelete(blockTabs.map(bt => bt.id))
    await configDatabase.configurationVersions.bulkDelete(versions.map(v => v.id))
    await configDatabase.bookConfigurations.delete(configuration.id)
  }

  const exportConfiguration = async (configurationUuid: string) => {
    // Вспомогательная функция для удаления id
    const excludeId = <T extends {id?: number}>(obj: T): Omit<T, 'id'> => {
      const {id, ...rest} = obj;
      return rest;
    };

    const config = await configDatabase.bookConfigurations
    .where("uuid").equals(configurationUuid).first();

    if (!config) return null;

    // Получение данных с исключением id
    const versions = (await configDatabase.configurationVersions
    .where("configurationUuid").equals(configurationUuid).toArray())
    .map(excludeId);

    const blocks = (await configDatabase.blocks
    .where("configurationVersionUuid").anyOf(versions.map(v => v.uuid)).toArray())
    .map(excludeId);

    const groups = (await configDatabase.blockParameterGroups
    .where("blockUuid").anyOf(blocks.map(b => b.uuid)).toArray())
    .map(excludeId);

    const parameters = (await configDatabase.blockParameters
    .where("groupUuid").anyOf(groups.map(g => g.uuid)).toArray())
    .map(excludeId);

    const possibleValues = (await configDatabase.blockParameterPossibleValues
    .where("parameterUuid").anyOf(parameters.map(p => p.uuid)).toArray())
    .map(excludeId);

    const relations = (await configDatabase.blocksRelations
    .where("configurationVersionUuid").anyOf(versions.map(v => v.uuid)).toArray())
    .map(excludeId);

    const tabs = (await configDatabase.blockTabs
    .where("blockUuid").anyOf(blocks.map(b => b.uuid)).toArray())
    .map(excludeId);

    return {
      configuration: excludeId(config), // Исключаем id у основной конфигурации
      versions,
      blocks,
      parameterGroups: groups,
      parameters,
      possibleValues,
      relations,
      tabs,
    };
  };

  const importConfiguration = async (data: any) => {
    if (await configDatabase.bookConfigurations.where("uuid").equals(data.configuration.uuid).count() > 0) {
      notifications.show({
        title: 'Ошибка',
        message: 'Конфигурация с таким UUID уже существует',
        color: 'red',
      });
      return false;
    }

    await configDatabase.transaction('rw', [
      configDatabase.bookConfigurations,
      configDatabase.configurationVersions,
      configDatabase.blocks,
      configDatabase.blockParameterGroups,
      configDatabase.blockParameters,
      configDatabase.blockParameterPossibleValues,
      configDatabase.blocksRelations,
      configDatabase.blockTabs,
    ], async () => {
      await configDatabase.bookConfigurations.add(data.configuration);
      await configDatabase.configurationVersions.bulkAdd(data.versions);
      await configDatabase.blocks.bulkAdd(data.blocks);
      await configDatabase.blockParameterGroups.bulkAdd(data.parameterGroups);
      await configDatabase.blockParameters.bulkAdd(data.parameters);
      await configDatabase.blockParameterPossibleValues.bulkAdd(data.possibleValues);
      await configDatabase.blocksRelations.bulkAdd(data.relations);
      await configDatabase.blockTabs.bulkAdd(data.tabs);
    });
    return true;
  };

  return {
    configurationList,
    saveConfiguration,
    removeConfiguration,
    exportConfiguration,
    importConfiguration,
  }
}
