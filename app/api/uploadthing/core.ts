import { createUploadthing } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { z } from "zod";

import type { FileRouter } from "uploadthing/next";

import { getCurrentUser } from "@/lib/auth";
import { requireWorkspacePermission } from "@/lib/db/data/mutation-auth";

const f = createUploadthing();

export const ourFileRouter = {
  documentImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 10,
    },
  })
    .input(
      z.object({
        workspaceId: z.string().uuid(),
      })
    )
    .middleware(async ({ input }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new UploadThingError("Unauthorized");
      }

      try {
        await requireWorkspacePermission(
          user.id,
          input.workspaceId,
          "document:write"
        );
      } catch {
        throw new UploadThingError(
          "Forbidden: insufficient workspace permissions"
        );
      }

      return { userId: user.id, workspaceId: input.workspaceId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        uploadedBy: metadata.userId,
        workspaceId: metadata.workspaceId,
        url: file.ufsUrl ?? file.url,
      };
    }),

  coverBanner: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .input(
      z.object({
        workspaceId: z.string().uuid(),
      })
    )
    .middleware(async ({ input }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new UploadThingError("Unauthorized");
      }

      try {
        await requireWorkspacePermission(
          user.id,
          input.workspaceId,
          "document:write"
        );
      } catch {
        throw new UploadThingError(
          "Forbidden: insufficient workspace permissions"
        );
      }

      return { userId: user.id, workspaceId: input.workspaceId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        uploadedBy: metadata.userId,
        workspaceId: metadata.workspaceId,
        url: file.ufsUrl ?? file.url,
      };
    }),

  workspaceLogo: f({
    image: {
      maxFileSize: "2MB",
      maxFileCount: 1,
    },
  })
    .input(
      z.object({
        workspaceId: z.string().uuid(),
      })
    )
    .middleware(async ({ input }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new UploadThingError("Unauthorized");
      }

      try {
        await requireWorkspacePermission(
          user.id,
          input.workspaceId,
          "workspace:settings"
        );
      } catch {
        throw new UploadThingError(
          "Forbidden: insufficient workspace permissions"
        );
      }

      return { userId: user.id, workspaceId: input.workspaceId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        uploadedBy: metadata.userId,
        workspaceId: metadata.workspaceId,
        url: file.ufsUrl ?? file.url,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
