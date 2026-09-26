import { pgTableCreator } from "drizzle-orm/pg-core";

import { lipiTableName } from "./table-prefix";

/**
 * Use to keep multiple projects schemas/tables in the same database.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator(lipiTableName);
