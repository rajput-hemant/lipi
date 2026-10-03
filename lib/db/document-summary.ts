import { getTableColumns } from "drizzle-orm";

import { documents } from "./schema";

const { content: _content, ...documentSummaryColumns } =
  getTableColumns(documents);

/** Select shape for every document column except the (large) `content`. */
export { documentSummaryColumns };
