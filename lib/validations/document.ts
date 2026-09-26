import * as z from "zod";

export const documentTitleSchema = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(200, "Title is too long");

export const createDocumentSchema = z.object({
  id: z.uuid(),
  workspaceId: z.uuid(),
  parentId: z.uuid().nullable().optional(),
  title: documentTitleSchema,
  icon: z.string().max(32).optional(),
});

export const updateDocumentSchema = z.object({
  id: z.uuid(),
  title: documentTitleSchema.optional(),
  icon: z.string().max(32).optional(),
  bannerUrl: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  inTrash: z.boolean().optional(),
  parentId: z.uuid().nullable().optional(),
});

export const duplicateDocumentSchema = z.object({
  sourceId: z.uuid(),
  newId: z.uuid(),
});
