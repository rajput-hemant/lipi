import { createUploadthing } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { z } from "zod";

import type { FileRouter } from "uploadthing/next";

import { getCurrentUser } from "@/lib/auth";
import { requireWorkspacePermission } from "@/lib/db/data/mutation-auth";

const f = createUploadthing();

type Permission = Parameters<typeof requireWorkspacePermission>[2];

function workspaceImageUpload({
  maxFileSize,
  maxFileCount,
  permission,
}: {
  maxFileSize: "2MB" | "4MB";
  maxFileCount: number;
  permission: Permission;
}) {
  return f({ image: { maxFileSize, maxFileCount } })
    .input(z.object({ workspaceId: z.string().uuid() }))
    .middleware(async ({ input }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new UploadThingError("Unauthorized");
      }

      try {
        await requireWorkspacePermission(
          user.id,
          input.workspaceId,
          permission
        );
      } catch {
        throw new UploadThingError(
          "Forbidden: insufficient workspace permissions"
        );
      }

      return { userId: user.id, workspaceId: input.workspaceId };
    })
    .onUploadComplete(({ metadata, file }) => ({
      uploadedBy: metadata.userId,
      workspaceId: metadata.workspaceId,
      url: file.ufsUrl ?? file.url,
    }));
}

export const ourFileRouter = {
  documentImage: workspaceImageUpload({
    maxFileSize: "4MB",
    maxFileCount: 10,
    permission: "document:write",
  }),
  coverBanner: workspaceImageUpload({
    maxFileSize: "4MB",
    maxFileCount: 1,
    permission: "document:write",
  }),
  workspaceLogo: workspaceImageUpload({
    maxFileSize: "2MB",
    maxFileCount: 1,
    permission: "workspace:settings",
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
