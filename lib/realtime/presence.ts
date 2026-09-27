import * as z from "zod";

import type { CollaboratorPresence } from "@/hooks/use-app-state";

const collaboratorSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  image: z.string().nullable(),
  color: z.string().min(1),
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function readCollaboratorPresence(
  states: Iterable<unknown>
): CollaboratorPresence[] {
  const collaborators = new Map<string, CollaboratorPresence>();

  for (const state of states) {
    if (!isRecord(state) || !isRecord(state.user)) continue;

    const parsed = collaboratorSchema.safeParse(state.user);
    if (parsed.success) collaborators.set(parsed.data.id, parsed.data);
  }

  return [...collaborators.values()];
}
