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

export const relations: Record<TableName, Record<string, { table: TableName; field: string}>> = {
  blockInstances: {
    blockUuid: { table: 'blocks', field: 'uuid'},
    parentInstanceUuid: { table: 'blockInstances', field: 'uuid'}
  },
  blocks: {
    parentBlockUuid: { table: 'blocks', field: 'uuid'},
    configurationUuid: { table: 'bookConfigurations', field: 'uuid' }
  },
  blockParameterGroups:{
    blockUuid: { table: 'blocks', field: 'uuid'}
  },
  blockParameters: {
    blockUuid: { table: 'blocks', field: 'uuid' },
    linkedBlockUuid: { table: 'blocks', field: 'uuid'},
    groupUuid: { table: 'blockParameterGroups', field: 'uuid'}
  },
  blockParameterInstances:{
    blockInstanceUuid: { table: 'blockInstances', field: 'uuid'},
    blockParameterUuid: { table: 'blockParameters', field: 'uuid'},
    blockParameterGroupUuid: { table: 'blockParameterGroups', field: 'uuid'}
  },
  blocksRelations: {
    sourceBlockUuid: { table: 'blocks', field: 'uuid' },
    targetBlockUuid: { table: 'blocks', field: 'uuid' },
    configurationUuid: { table: 'bookConfigurations', field: 'uuid' }
  },
  blockInstanceRelations:{
    blockRelationUuid: { table: 'blocksRelations', field: 'uuid'},
    sourceInstanceUuid: { table: 'blockInstances', field: 'uuid'},
    targetInstanceUuid: { table: 'blockInstances', field: 'uuid'},
    sourceBlockUuid: { table: 'blocks', field: 'uuid'},
    targetBlockUuid: { table: 'blocks', field: 'uuid'}
  },
  blockInstanceSceneLinks:{
    blockInstanceUuid: { table: 'blockInstances', field: 'uuid'},
    blockUuid: { table: 'blocks', field: 'uuid'}
  },
  blockTabs:{
    blockUuid: { table: 'blocks', field: 'uuid' },
    childBlockUuid: { table: 'blocks', field: 'uuid'},
    relationUuid: { table: 'blocksRelations', field: 'uuid'},
    referencingParamUuid: { table: 'blockParameters', field: 'uuid'}
  },
  scenes:{
    chaperId: { table: 'chapters', field: 'id'}
  },
  notes:{
    noteGroupUuid: { table: 'notesGroups', field: 'uuid'},
  },
  books:{
    configurationUuid: { table: 'bookConfigurations', field: 'uuid'}
  },
};
