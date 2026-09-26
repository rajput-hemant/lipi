import { getTableColumns, getTableName } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";

import type { PgTable } from "drizzle-orm/pg-core";

export type SerializedSharedAuthSchema = {
  tables: Record<string, SerializedTable>;
};

type SerializedTable = {
  columns: SerializedColumn[];
  primaryKey: string[];
  uniqueConstraints: string[];
  foreignKeys: SerializedForeignKey[];
  indexes: SerializedIndex[];
};

type SerializedColumn = {
  name: string;
  dataType: string;
  notNull: boolean;
  primaryKey: boolean;
  hasDefault: boolean;
};

type SerializedForeignKey = {
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onDelete: string | undefined;
};

type SerializedIndex = {
  name: string | undefined;
  unique: boolean;
};

export function serializeSharedAuthTable(table: PgTable): SerializedTable {
  const config = getTableConfig(table);
  const columns = getTableColumns(table);

  return {
    columns: Object.values(columns)
      .map((column) => ({
        name: column.name,
        dataType: column.getSQLType(),
        notNull: column.notNull,
        primaryKey: column.primary,
        hasDefault: column.hasDefault,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    primaryKey: config.primaryKeys
      .flatMap((pk) => pk.columns.map((column) => column.name))
      .sort(),
    uniqueConstraints: config.uniqueConstraints
      .flatMap((constraint) => constraint.columns.map((column) => column.name))
      .sort(),
    foreignKeys: config.foreignKeys
      .map((fk) => {
        const reference = fk.reference();
        return {
          columns: reference.columns.map((column) => column.name).sort(),
          referencedTable: getTableName(reference.foreignTable),
          referencedColumns: reference.foreignColumns
            .map((column) => column.name)
            .sort(),
          onDelete: fk.onDelete,
        };
      })
      .sort((a, b) => a.columns.join(",").localeCompare(b.columns.join(","))),
    indexes: config.indexes
      .map((index) => ({
        name: index.config.name,
        unique: Boolean(index.config.unique),
      }))
      .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")),
  };
}

export function serializeSharedAuthTables(
  tables: Record<string, PgTable>
): SerializedSharedAuthSchema {
  const serialized: SerializedSharedAuthSchema["tables"] = {};

  for (const table of Object.values(tables)) {
    serialized[getTableName(table)] = serializeSharedAuthTable(table);
  }

  return { tables: serialized };
}
