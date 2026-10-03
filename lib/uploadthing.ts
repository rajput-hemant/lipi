import {
  generateReactHelpers,
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";

import type { OurFileRouter } from "@/app/api/uploadthing/core";

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>();

/** Uploads one image to a workspace-scoped endpoint and returns its URL. */
export async function uploadImage(
  endpoint: keyof OurFileRouter,
  file: File,
  workspaceId: string
) {
  const res = await uploadFiles(endpoint, {
    files: [file],
    input: { workspaceId },
  });
  const uploaded = res?.[0];
  const url = uploaded?.serverData?.url ?? uploaded?.url;
  if (!url) throw new Error("Upload failed: No URL returned");
  return url;
}
