import { validate as validateUuid } from "uuid";

export type RealtimeRoom = {
  kind: "document" | "workspace";
  id: string;
  name: string;
};

export function parseRealtimeRoomName(name: string): RealtimeRoom | null {
  const [kind, id, ...rest] = name.split(":");

  if (
    rest.length > 0 ||
    (kind !== "document" && kind !== "workspace") ||
    !id ||
    !validateUuid(id)
  ) {
    return null;
  }

  return { kind, id, name };
}

export function documentRoomName(documentId: string) {
  return `document:${documentId}`;
}

export function workspaceRoomName(workspaceId: string) {
  return `workspace:${workspaceId}`;
}
