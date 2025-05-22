import {useLiveQuery} from 'dexie-react-hooks';
import {
  IBlock,
  IBlockParameterGroup,
  IBookConfiguration,
  IBlockTitleForms,
} from "@/entities/ConstructorEntities";
import {configDatabase} from "@/entities/configuratorDb";


import {useDialog} from "@/providers/DialogProvider/DialogProvider";
import {bookDb} from "@/entities/bookDb";
import {BlockRepository} from "@/repository/BlockRepository";
import { InkLuminApiError } from "@/api/inkLuminApi";
import {BlockInstanceRepository} from "@/repository/BlockInstanceRepository";
import {generateUUID} from "@/utils/UUIDUtils";

export const useBookConfigurationEditForm = (configurationUuid: string,
                                             bookUuid?: string,
                                             currentBlock?: IBlock) => {

  const {showDialog} = useDialog();

  const db = bookUuid ? bookDb : configDatabase;
  const isBookDb = !!bookUuid;

  // Данные конфигурации
  const configuration  = useLiveQuery<IBookConfiguration>(() => {
    return db.bookConfigurations.where("uuid").equals(configurationUuid).first();
  }, [configurationUuid]);


  // Список строительных блоков конфигурации
  const blockList = useLiveQuery<IBlock[]>(() => {
    if (!configurationUuid) {
      return []
    }
    return db.blocks.where('configurationUuid').equals(configurationUuid).toArray();
  }, [configurationUuid])

  // Список групп параметров для строительного блока
  const paramGroupList = useLiveQuery<IBlockParameterGroup[]>(() => {
    if (!configurationUuid || !currentBlock || !currentBlock?.uuid) {
      return []
    }
    return db.blockParameterGroups.where('blockUuid').equals(currentBlock?.uuid).toArray();
  }, [currentBlock])


  // Cохранение блока
  const saveBlock = async (blockData: IBlock, manualTitleForms?: IBlockTitleForms) => {
    try {
      await BlockRepository.save(db, blockData, isBookDb, manualTitleForms);
    } catch (error) {
      if (error instanceof InkLuminApiError) {
        // Re-throw the specific error to be caught by the modal
        throw error;
      }
      // For other errors, log them or handle as previously (e.g., general notifications if any)
      console.error("Error in useBookConfigurationEditForm saveBlock:", error);
      throw error; // Re-throw other errors too, or handle them with generic notifications
    }
  }

  // Удаление блока и связанных с ним данных
  const removeBlock = async (block: IBlock) => {
    const result = await showDialog('Подтверждение', 'Вы действительно хотите удалить блок и все связанные с ним данные?');
    if (!result || !block.uuid) return;
    if (isBookDb){
      await BlockInstanceRepository.removeByBlock(bookDb, block.uuid)
    }
    await BlockRepository.remove(db, block)
  };

  const updateConfiguration = async (configuration: IBookConfiguration) => {
    // Если конфигурация уже существует, обновляем ее
    if (configuration.uuid){
      await db.bookConfigurations.update(configuration.id, configuration)
      return
    }
  }

  return {
    configuration,
    blockList,
    paramGroupList,
    saveBlock,
    removeBlock,
    updateConfiguration
  }
}
