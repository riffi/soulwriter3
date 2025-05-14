// utils.ts

import {relations, TableName} from "@/pages/tech/DbViewer/types";

export const getReverseRelations = (currentTableName: TableName) => {
  const reverseRels = [];
  for (const [sourceTable, fields] of Object.entries(relations)) {
    for (const [sourceField, rel] of Object.entries(fields)) {
      if (rel.table === currentTableName) {
        reverseRels.push({
          sourceTable: sourceTable as TableName,
          sourceField,
          targetField: rel.field,
        });
      }
    }
  }
  return reverseRels;
};
