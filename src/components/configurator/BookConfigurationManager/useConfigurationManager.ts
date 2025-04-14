import {useLiveQuery} from "dexie-react-hooks";
import { generateUUID } from '@/utils/UUIDUtils';
import {IBookConfiguration} from "@/entities/ConstructorEntities";
import {configDatabase} from "@/entities/condiguratorDb";
import {useDialog} from "@/providers/DialogProvider/DialogProvider";
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
      isDraft: true,
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

    await configDatabase.blockParameterPossibleValues.bulkDelete(paramsPossibleValues.map(pv => pv.id))
    await configDatabase.blockParameters.bulkDelete(parameters.map(p => p.id))
    await configDatabase.blockParameterGroups.bulkDelete(paramGroups.map(pg => pg.id))
    await configDatabase.blocks.bulkDelete(blocks.map(b => b.id))
    await configDatabase.configurationVersions.bulkDelete(versions.map(v => v.id))
    await configDatabase.bookConfigurations.delete(configuration.id)
  }

  return {
    configurationList,
    saveConfiguration,
    removeConfiguration
  }
}
