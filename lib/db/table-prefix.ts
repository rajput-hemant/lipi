export const LIPI_TABLE_PREFIX = "lipi";

export function lipiTableName(name: string) {
  return `${LIPI_TABLE_PREFIX}_${name}`;
}
