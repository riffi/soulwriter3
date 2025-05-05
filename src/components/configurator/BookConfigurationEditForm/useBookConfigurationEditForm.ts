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
import {bookDb} from "@/entities/bookDb";
import {BlockRepository} from "@/repository/BlockRepository";
import {BlockInstanceRepository} from "@/repository/BlockInstanceRepository";
import {IBlockInstance} from "@/entities/BookEntities";

export const useBookConfigurationEditForm = (configurationUuid: string,
                                             bookUuid?: string,
                                             currentVersion?: IBookConfigurationVersion,
                                             currentBlock?: IBlock) => {

  const {showDialog} = useDialog();

  const db = bookUuid ? bookDb : configDatabase;
  const isBookDb = !!bookUuid;

  // Данные конфигурации
  const configuration  = useLiveQuery<IBookConfiguration>(() => {
    return db.bookConfigurations.where("uuid").equals(configurationUuid).first();
  }, [configurationUuid]);

  const versionList = useLiveQuery(async () => {
    return db.configurationVersions.where("configurationUuid").equals(configurationUuid).toArray()
  }, [configurationUuid, configuration])

  // Список строительных блоков конфигурации
  const blockList = useLiveQuery<IBlock[]>(() => {
    if (!currentVersion) {
      return []
    }
    return db.blocks.where('configurationVersionUuid').equals(currentVersion?.uuid).toArray();
  }, [currentVersion])

  // Список групп параметров для строительного блока
  const paramGroupList = useLiveQuery<IBlockParameterGroup[]>(() => {
    if (!currentVersion || !currentBlock) {
      return []
    }
    return db.blockParameterGroups.where('blockUuid').equals(currentBlock?.uuid).toArray();
  }, [currentBlock])

  const {publishVersion} = usePublishVersion(configurationUuid, configuration, currentVersion, versionList)


  // Cохранение блока
  const saveBlock = async (blockData: IBlock) => {
    if (!blockData.uuid) {
      const blockUuid = await BlockRepository.save(db, blockData)
      if (isBookDb && blockData.structureKind === 'single'){
        const uuid = generateUUID();
        const newInstance: IBlockInstance = {
          blockUuid,
          uuid,
          title: blockData?.title,
        };
        await BlockInstanceRepository.create(db, newInstance)
      }
    }
    else{
      await BlockRepository.save(db, blockData)
    }


  }

  // Удаление блока и связанных с ним данных
  const removeBlock = async (block: IBlock) => {
    const result = await showDialog('Подтверждение', 'Вы действительно хотите удалить блок и все связанные с ним данные?');
    if (!result || !block.uuid) return;
    await BlockRepository.remove(db, block)
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
