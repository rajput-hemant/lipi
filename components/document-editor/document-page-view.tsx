"use client";

import dynamic from "next/dynamic";

import type { Document } from "@/types/db";

import { DocumentHeader } from "./document-header";
import { Skeleton } from "@/components/ui/skeleton";

const DocumentBlockEditor = dynamic(
  () =>
    import("./document-block-editor").then(
      (module) => module.DocumentBlockEditor,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto w-full max-w-3xl space-y-4 px-6 py-8">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    ),
  },
);

type DocumentPageViewProps = {
  document: Document;
};

export function DocumentPageView({ document }: DocumentPageViewProps) {
  return (
    <div className="min-h-full">
      <DocumentHeader key={document.id} documentId={document.id} />
      <DocumentBlockEditor document={document} />
    </div>
  );
}
