import {useLiveQuery} from "dexie-react-hooks";
import { generateUUID } from '@/utils/UUIDUtils';
import {IBookConfiguration} from "@/entities/ConstructorEntities";
import {configDatabase} from "@/entities/configuratorDb";
import {useDialog} from "@/providers/DialogProvider/DialogProvider";
import {notifications} from "@mantine/notifications";
import {ConfigurationRepository} from "@/repository/ConfigurationRepository";
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
  }

  const removeConfiguration = async (configuration: IBookConfiguration) => {
    const result = await showDialog("Внимание", "Вы уверены, что хотите удалить конфигурацию?")
    if (!result){
      return
    }

    const blocks = await configDatabase
      .blocks
      .where('configurationUuid')
      .equals(configuration.uuid)
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
    await configDatabase.bookConfigurations.delete(configuration.id)
  }

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
      configDatabase.blocks,
      configDatabase.blockParameterGroups,
      configDatabase.blockParameters,
      configDatabase.blockParameterPossibleValues,
      configDatabase.blocksRelations,
      configDatabase.blockTabs,
    ], async () => {
      await configDatabase.bookConfigurations.add(data.configuration);
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
    importConfiguration,
  }
}
