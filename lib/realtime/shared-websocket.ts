"use client";

import { HocuspocusProviderWebsocket } from "@hocuspocus/provider";

import { getRealtimeUrl } from "./client";

let sharedWebsocket: HocuspocusProviderWebsocket | null = null;
let sharedUrl: string | null = null;

export function getSharedHocuspocusWebsocket() {
  const url = getRealtimeUrl();
  if (!url) return null;

  if (!sharedWebsocket || sharedUrl !== url) {
    sharedWebsocket?.destroy();
    sharedWebsocket = new HocuspocusProviderWebsocket({ url });
    sharedUrl = url;
  }

  return sharedWebsocket;
}
