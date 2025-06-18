import { IBook } from "@/entities/BookEntities";
import { configDatabase } from "@/entities/configuratorDb";
import { generateUUID } from "@/utils/UUIDUtils";
import { bookDb, connectToBookDatabase, deleteBookDatabase } from "@/entities/bookDb";
import {
  IBlock,
  IBlockStructureKind,
  IBookConfiguration
} from "@/entities/ConstructorEntities";
import { BlockInstanceRepository } from "@/repository/BlockInstance/BlockInstanceRepository";
import { BlockParameterInstanceRepository } from "@/repository/BlockInstance/BlockParameterInstanceRepository";
import { BookRepository } from "@/repository/Book/BookRepository";

export interface ServiceResult<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

async function getBookConfiguration(configurationUuid: string) {
  return configDatabase.bookConfigurations.where({ uuid: configurationUuid }).first();
}

async function copyParameterPossibleValues(parameterUuid: string) {
  const possibleValues = await configDatabase.blockParameterPossibleValues
    .where({ parameterUuid })
    .toArray();
  await bookDb.blockParameterPossibleValues.bulkAdd(possibleValues);
}

async function copyBlockParameters(groupUuid: string) {
  const parameters = await configDatabase.blockParameters
    .where({ groupUuid })
    .toArray();
  await bookDb.blockParameters.bulkAdd(parameters);
  await Promise.all(parameters.map(p => copyParameterPossibleValues(p.uuid!)));
}

async function copyBlockParameterGroups(blockUuid: string) {
  const parameterGroups = await configDatabase.blockParameterGroups
    .where({ blockUuid })
    .toArray();
  await bookDb.blockParameterGroups.bulkAdd(parameterGroups);
  await Promise.all(parameterGroups.map(g => copyBlockParameters(g.uuid!)));
}

async function copyBlockTabs(blockUuid: string) {
  const tabs = await configDatabase.blockTabs.where({ blockUuid }).toArray();
  await bookDb.blockTabs.bulkAdd(tabs);
}

async function createSingleInstance(block: IBlock) {
  if (block.structureKind === IBlockStructureKind.single) {
    const instance = await BlockInstanceRepository.createSingleInstance(bookDb, block);
    await BlockParameterInstanceRepository.appendDefaultParams(bookDb, instance);
  }
}

async function copyBlocks(oldConfigurationUuid: string, newConfigurationUuid: string) {
  const blocks = await configDatabase.blocks
    .where({ configurationUuid: oldConfigurationUuid })
    .toArray();
  blocks.forEach(b => {
    b.configurationUuid = newConfigurationUuid;
  });
  await bookDb.blocks.bulkAdd(blocks);
  await Promise.all(
    blocks.map(block => Promise.all([copyBlockParameterGroups(block.uuid!), copyBlockTabs(block.uuid!)]))
  );
  await Promise.all(blocks.map(block => createSingleInstance(block)));
}

async function copyBlockRelations(oldConfigurationUuid: string, newConfigurationUuid: string) {
  const relations = await configDatabase.blocksRelations
    .where({ configurationUuid: oldConfigurationUuid })
    .toArray();
  relations.forEach(r => {
    r.configurationUuid = newConfigurationUuid;
  });
  await bookDb.blocksRelations.bulkAdd(relations);
}

async function copyKnowledgeBasePages(oldConfigurationUuid: string, newConfigurationUuid: string) {
  const pages = await configDatabase.knowledgeBasePages
    .where({ configurationUuid: oldConfigurationUuid })
    .toArray();
  pages.forEach(page => {
    page.configurationUuid = newConfigurationUuid;
  });
  await bookDb.knowledgeBasePages.bulkAdd(pages);
}

async function copyConfigurationToBookDb(configuration: IBookConfiguration, isNew = false) {
  const newConfigurationUuid = generateUUID();
  await bookDb.bookConfigurations.add({ ...configuration, uuid: newConfigurationUuid });
  if (!isNew) {
    await copyBlocks(configuration.uuid!, newConfigurationUuid);
    await copyBlockRelations(configuration.uuid!, newConfigurationUuid);
    await copyKnowledgeBasePages(configuration.uuid!, newConfigurationUuid);
  }
  return newConfigurationUuid;
}

async function initBookDb(book: IBook): Promise<ServiceResult> {
  try {
    await connectToBookDatabase(book.uuid);
    let configuration: IBookConfiguration | undefined;
    const isNew = !book.configurationUuid;
    if (book.configurationUuid) {
      configuration = await getBookConfiguration(book.configurationUuid);
      if (!configuration) {
        return { success: false, message: 'Конфигурация не найдена' };
      }
    } else {
      configuration = { uuid: '', title: book.title, description: '' };
    }
    const configurationUuid = await copyConfigurationToBookDb(configuration, isNew);
    book.configurationUuid = configurationUuid;
    if (book.chapterOnlyMode === undefined) {
      book.chapterOnlyMode = 1;
    }
    await BookRepository.create(bookDb, book);
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

async function saveBook(book: IBook): Promise<ServiceResult> {
  try {
    if (book.chapterOnlyMode === undefined) {
      book.chapterOnlyMode = 1;
    }
    if (book.uuid) {
      await BookRepository.update(configDatabase, book.uuid, book);
    } else {
      book.uuid = generateUUID();
      const initResult = await initBookDb(book);
      if (!initResult.success) return initResult;
      await BookRepository.create(configDatabase, book);
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

async function deleteBook(book: IBook): Promise<ServiceResult> {
  try {
    await BookRepository.remove(configDatabase, book.uuid);
    await deleteBookDatabase(book.uuid);
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export const BookService = {
  initBookDb,
  getBookConfiguration,
  copyConfigurationToBookDb,
  copyBlockRelations,
  copyBlocks,
  copyBlockTabs,
  copyBlockParameterGroups,
  copyBlockParameters,
  copyParameterPossibleValues,
  createSingleInstance,
  copyKnowledgeBasePages,
  saveBook,
  deleteBook,
};

export type { ServiceResult };

