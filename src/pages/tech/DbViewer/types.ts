import {bookDb} from "@/entities/bookDb";
import {configDatabase} from "@/entities/configuratorDb";

export type TableName = keyof typeof bookDb | keyof typeof configDatabase;

export interface TableData {
  name: TableName;
  data: any[];
}

export interface HistoryEntry {
  table: TableData;
  filter?: {
    field: string;
    value: string;
  };
}

export type DatabaseType = 'book' | 'config';

export const relations: Record<TableName, Record<string, { table: TableName; field: string; db: 'book' | 'config' }>> = {
  configurationVersions: {
    configurationUuid: { table: 'bookConfigurations', field: 'uuid'},
  },
  blockInstances: {
    blockUuid: { table: 'blocks', field: 'uuid'},
    parentInstanceUuid: { table: 'blockInstances', field: 'uuid'}
  },
  blocks: {
    parentBlockUuid: { table: 'blocks', field: 'uuid'},
    configurationVersionUuid: { table: 'configurationVersions', field: 'uuid' }
  },
  blockParameters: {
    blockUuid: { table: 'blocks', field: 'uuid' },
    linkedBlockUuid: { table: 'blocks', field: 'uuid'}
  },
  blocksRelations: {
    sourceBlockUuid: { table: 'blocks', field: 'uuid' },
    targetBlockUuid: { table: 'blocks', field: 'uuid' },
    configurationVersionUuid: { table: 'configurationVersions', field: 'uuid' }
  },
  blockTabs:{
    blockUuid: { table: 'blocks', field: 'uuid' },
    childBlockUuid: { table: 'blocks', field: 'uuid'},
    relationUuid: { table: 'blocksRelations', field: 'uuid'}
  }
};
