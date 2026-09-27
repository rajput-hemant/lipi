export type RealtimeRoomAccess = {
  roomName: string;
  workspaceId: string;
  role: "owner" | "editor" | "viewer";
  readOnly: boolean;
  documentId: string | null;
};

export type RealtimeContext = RealtimeRoomAccess & {
  userId: string;
  name: string;
  image: string | null;
};

export class RealtimeAuthorizationError extends Error {
  constructor() {
    super("Forbidden");
    this.name = "RealtimeAuthorizationError";
  }
}
