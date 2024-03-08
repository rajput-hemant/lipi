import {
  FileIcon,
  Folder,
  Ghost,
  Trash2,
  TrashIcon,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";

import type { File } from "@/types/db";

import { useAppState } from "@/hooks/use-app-state";
import {
  deleteFileFromDb,
  deleteFolderFromDb,
  updateFileInDb,
  updateFolderInDb,
} from "@/lib/db/queries";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function Trash() {
  const { files, folders, updateFile, updateFolder, deleteFile, deleteFolder } =
    useAppState();

  const trashedFiles = files.filter((file) => file.inTrash);
  const trashedFolders = folders.filter((folder) => folder.inTrash);

  async function restoreFile(fileId: string) {
    const file = files.find((f) => f.id === fileId);

    if (!file) {
      toast.error("Something went wrong", { description: "File not found." });
      return;
    }

    const updatedFile: File = { ...file, inTrash: false };
    updateFile(updatedFile);

    toast.promise(updateFileInDb(updatedFile), {
      loading: "Restoring file...",
      success: "File restored",
      error: "Failed to restore file",
    });
  }

  async function restoreFolder(folderId: string) {
    const folder = folders.find((f) => f.id === folderId);

    if (!folder) {
      toast.error("Something went wrong", { description: "Folder not found." });
      return;
    }

    const updatedFolder: File = { ...folder, inTrash: false };
    updateFolder(updatedFolder);

    toast.promise(updateFolderInDb(updatedFolder), {
      loading: "Restoring folder...",
      success: "Folder restored",
      error: "Failed to restore folder",
    });
  }

  async function deleteFileHandler(fileId: string) {
    deleteFile(fileId);

    toast.promise(deleteFileFromDb(fileId), {
      loading: "Deleting file...",
      success: "File deleted permanently.",
      error: "Something went wrong! Unable to delete file.",
    });
  }

  async function deleteFolderHandler(folderId: string) {
    deleteFolder(folderId);

    toast.promise(deleteFolderFromDb(folderId), {
      loading: "Deleting folder...",
      success: "Folder deleted permanently.",
      error: "Something went wrong! Unable to delete folder.",
    });
  }

  async function clearTrash() {
    Promise.all(trashedFiles.map((f) => deleteFileHandler(f.id!)));
    Promise.all(trashedFolders.map((f) => deleteFolderHandler(f.id!)));
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="font-heading text-3xl drop-shadow-md">Trashed Folders</h3>

      {trashedFolders.length > 0 ?
        <div className="flex flex-wrap gap-4">
          {trashedFolders.map((folder) => (
            <div
              key={folder.id}
              title={folder.title}
              className="size-44 space-y-4"
            >
              <div className="group relative rounded-md border shadow">
                <div className="mx-auto flex h-36 items-center justify-center text-5xl drop-shadow-md">
                  {folder.iconId ? folder.iconId : <Folder size={56} />}
                </div>

                <div className="absolute inset-0 hidden items-center justify-center space-x-2 backdrop-blur-sm group-hover:flex">
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => restoreFolder(folder.id!)}
                      >
                        <Undo2 size={20} />
                      </Button>
                    </TooltipTrigger>

                    <TooltipContent>Restore</TooltipContent>
                  </Tooltip>

                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => deleteFolderHandler(folder.id!)}
                      >
                        <Trash2 size={20} />
                      </Button>
                    </TooltipTrigger>

                    <TooltipContent>Delete Permanently</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <p className="truncate text-center font-medium">{folder.title}</p>
            </div>
          ))}
        </div>
      : <div className="flex flex-col items-center gap-2 rounded-md border border-dashed py-10 font-medium drop-shadow-md">
          <Ghost size={32} className="drop-shadow" />
          <span className="drop-shadow-sm">Nothing to show here!</span>
        </div>
      }

      <h3 className="font-heading text-3xl drop-shadow-md">Trashed Files</h3>

      {trashedFiles.length > 0 ?
        <div className="flex flex-wrap gap-4">
          {trashedFiles.map((file) => (
            <div key={file.id} title={file.title} className="size-44 space-y-4">
              <div className="group relative rounded-md border shadow">
                <div className="mx-auto flex h-36 items-center justify-center text-5xl drop-shadow-md">
                  {file.iconId ? file.iconId : <FileIcon size={56} />}
                </div>

                <div className="absolute inset-0 hidden items-center justify-center space-x-2 backdrop-blur-sm group-hover:flex">
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => restoreFile(file.id!)}
                      >
                        <Undo2 size={20} />
                      </Button>
                    </TooltipTrigger>

                    <TooltipContent>Restore</TooltipContent>
                  </Tooltip>

                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => deleteFileHandler(file.id!)}
                      >
                        <Trash2 size={20} />
                      </Button>
                    </TooltipTrigger>

                    <TooltipContent>Delete Permanently</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <p className="truncate text-center font-medium">{file.title}</p>
            </div>
          ))}
        </div>
      : <div className="flex flex-col items-center gap-2 rounded-md border border-dashed py-10 font-medium drop-shadow-md">
          <Ghost size={32} className="drop-shadow" />
          <span className="drop-shadow-sm">Nothing to show here!</span>
        </div>
      }

      <Button
        variant="destructive"
        onClick={clearTrash}
        disabled={!trashedFiles.length && !trashedFolders.length}
        className="mx-auto mt-10 gap-2"
      >
        <TrashIcon size={20} /> Clear Trash
      </Button>
    </div>
  );
}
