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
import {useDialog} from "@/providers/DialogProvider/DialogProvider";
import {
  usePublishVersion
} from "@/components/configurator/BookConfigurationEditForm/usePublishVersion";

export const useBookConfigurationEditForm = (configurationUuid: string,
                                             currentVersion?: IBookConfigurationVersion,
                                             currentBlock?: IBlock) => {

  const {showDialog} = useDialog();
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

  const {publishVersion} = usePublishVersion(configurationUuid, configuration, currentVersion, versionList)

  const appendDefaultParamGroup = async (blockData: IBlock) => {
    await configDatabase.blockParameterGroups.add({
      blockUuid: blockData.uuid,
      uuid: generateUUID(),
      orderNumber: 0,
      description: '',
      title: 'Основное'
    })
  }

  // Cохранение блока
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

  // Удаление блока и связанных с ним данных
  const removeBlock = async (block: IBlock) => {
    const result = await showDialog('Подтверждение', 'Вы действительно хотите удалить блок и все связанные с ним данные?');
    if (!result || !block.uuid) return;

    await configDatabase.transaction('rw',
        [
          configDatabase.blocks,
          configDatabase.blockParameterGroups,
          configDatabase.blockParameters,
          configDatabase.blockParameterPossibleValues
        ],
        async () => {
          // Получаем все группы параметров блока
          const groups = await configDatabase.blockParameterGroups
          .where('blockUuid')
          .equals(block.uuid)
          .toArray();

          // Для каждой группы получаем параметры
          for (const group of groups) {
            if (!group.uuid) continue;

            const parameters = await configDatabase.blockParameters
            .where('groupUuid')
            .equals(group.uuid)
            .toArray();

            // Для каждого параметра удаляем возможные значения
            for (const parameter of parameters) {
              if (!parameter.uuid) continue;

              await configDatabase.blockParameterPossibleValues
              .where('parameterUuid')
              .equals(parameter.uuid)
              .delete();
            }

            // Удаляем параметры группы
            await configDatabase.blockParameters
            .where('groupUuid')
            .equals(group.uuid)
            .delete();
          }

          // Удаляем группы параметров блока
          await configDatabase.blockParameterGroups
          .where('blockUuid')
          .equals(block.uuid)
          .delete();

          // Удаляем сам блок
          await configDatabase.blocks
          .where('uuid')
          .equals(block.uuid)
          .delete();
        }
    );
  };

  return {
    configuration,
    publishVersion,
    versionList,
    blockList,
    paramGroupList,
    saveBlock,
    removeBlock
  }
}
