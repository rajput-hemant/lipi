"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loading03Icon, Upload01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { EmojiPicker } from "@/components/emoji-picker";
import { useNotifyWorkspacePageChanges } from "@/components/realtime/workspace-realtime-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAppActions } from "@/hooks/use-app-state";
import {
  createWorkspaceCollaboratorInvite,
  listWorkspaceMembers,
  removeWorkspaceMember,
  updateCollaboratorRole,
} from "@/lib/db/actions/workspace-members";
import {
  deleteWorkspace,
  transferWorkspaceOwnership,
  updateWorkspaceSettings,
} from "@/lib/db/actions/workspace-settings";
import {
  mutationErrorMessage,
  runMutationToast,
  unwrapMutation,
} from "@/lib/db/mutation-result";
import { uploadImage } from "@/lib/uploadthing";

const settingsSchema = z.object({
  title: z.string().min(1, "Name is required"),
  logo: z.union([z.url(), z.literal("")]).optional(),
});

const inviteSchema = z.object({
  email: z.email(),
  role: z.enum(["editor", "viewer"]),
});

type SettingsForm = z.infer<typeof settingsSchema>;
type InviteForm = z.infer<typeof inviteSchema>;

type MembersPayload = Extract<
  Awaited<ReturnType<typeof listWorkspaceMembers>>,
  { ok: true }
>["data"];

export function Settings() {
  const pathname = usePathname();
  const router = useRouter();
  const appStore = useAppActions();
  const notifyPageChanges = useNotifyWorkspacePageChanges();
  const workspaceId = pathname.split("/")[2];
  const [data, setData] = React.useState<MembersPayload | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedEmoji, setSelectedEmoji] = React.useState("💼");
  const [transferTarget, setTransferTarget] = React.useState("");
  const [uploadingLogo, setUploadingLogo] = React.useState(false);
  const logoFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const settingsForm = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { title: "", logo: "" },
  });

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !workspaceId) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo file is too large (max 2MB)");
      event.target.value = "";
      return;
    }

    try {
      setUploadingLogo(true);
      const url = await uploadImage("workspaceLogo", file, workspaceId);
      settingsForm.setValue("logo", url, { shouldDirty: true });
      toast.success("Workspace logo uploaded");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload workspace logo"
      );
    } finally {
      setUploadingLogo(false);
      event.target.value = "";
    }
  }

  const inviteForm = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "editor" },
  });

  const applyMembersPayload = React.useCallback(
    (payload: MembersPayload) => {
      setData(payload);
      setSelectedEmoji(payload.workspace.iconId);
      settingsForm.reset({
        title: payload.workspace.title,
        logo: payload.workspace.logo ?? "",
      });
      setLoading(false);
    },
    [settingsForm]
  );

  const refresh = React.useCallback(async () => {
    if (!workspaceId) return;
    try {
      const payload = await unwrapMutation(listWorkspaceMembers(workspaceId));
      applyMembersPayload(payload);
    } catch (error) {
      toast.error(mutationErrorMessage(error, "Failed to load settings"));
      setLoading(false);
    }
  }, [workspaceId, applyMembersPayload]);

  React.useEffect(() => {
    if (!workspaceId) return;
    let cancelled = false;

    void unwrapMutation(listWorkspaceMembers(workspaceId))
      .then((payload) => {
        if (!cancelled) applyMembersPayload(payload);
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(mutationErrorMessage(error, "Failed to load settings"));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [workspaceId, applyMembersPayload]);

  function afterMutation() {
    router.refresh();
    notifyPageChanges();
    refresh();
  }

  async function saveSettings(values: SettingsForm) {
    if (!workspaceId) return;
    runMutationToast(
      updateWorkspaceSettings({
        workspaceId,
        title: values.title,
        iconId: selectedEmoji,
        logo: values.logo,
      }),
      {
        loading: "Saving workspace settings...",
        success: () => {
          if (appStore.workspace) {
            appStore.setWorkspace({
              ...appStore.workspace,
              title: values.title,
              iconId: selectedEmoji,
              logo: values.logo || null,
            });
          }
          afterMutation();
          return "Workspace updated";
        },
        failed: "Failed to update workspace",
      }
    );
  }

  async function sendInvite(values: InviteForm) {
    if (!workspaceId) return;
    runMutationToast(
      createWorkspaceCollaboratorInvite({ workspaceId, ...values }),
      {
        loading: "Sending invite...",
        success: () => {
          inviteForm.reset({ email: "", role: values.role });
          refresh();
          return "Invite created";
        },
        failed: "Failed to invite member",
      }
    );
  }

  async function changeRole(collaboratorId: string, role: "editor" | "viewer") {
    if (!workspaceId) return;
    runMutationToast(
      updateCollaboratorRole({ workspaceId, collaboratorId, role }),
      {
        loading: "Updating role...",
        success: () => {
          afterMutation();
          return "Role updated";
        },
        failed: "Failed to update role",
      }
    );
  }

  async function removeMember(collaboratorId: string) {
    if (!workspaceId) return;
    runMutationToast(removeWorkspaceMember({ workspaceId, collaboratorId }), {
      loading: "Removing member...",
      success: () => {
        notifyPageChanges();
        refresh();
        return "Member removed";
      },
      failed: "Failed to remove member",
    });
  }

  async function confirmTransfer() {
    if (!workspaceId || !transferTarget) return;
    runMutationToast(
      transferWorkspaceOwnership({
        workspaceId,
        newOwnerUserId: transferTarget,
      }),
      {
        loading: "Transferring ownership...",
        success: () => {
          afterMutation();
          return "Ownership transferred";
        },
        failed: "Transfer failed",
      }
    );
  }

  async function confirmDelete() {
    if (!workspaceId) return;
    runMutationToast(deleteWorkspace({ workspaceId }), {
      loading: "Deleting workspace...",
      success: () => {
        router.replace("/dashboard");
        return "Workspace deleted";
      },
      failed: "Failed to delete workspace",
    });
  }

  if (!workspaceId) {
    return (
      <p className="text-sm text-muted-foreground">
        Open a workspace to manage its settings.
      </p>
    );
  }

  if (!loading && !data) {
    return (
      <p role="alert" className="text-sm text-muted-foreground">
        Unable to load workspace settings.
      </p>
    );
  }

  if (loading || !data) {
    return (
      <div
        role="status"
        aria-label="Loading settings"
        className="flex items-center justify-center py-12 text-muted-foreground"
      >
        <HugeiconsIcon
          icon={Loading03Icon}
          strokeWidth={2}
          className="size-5 animate-spin"
        />
      </div>
    );
  }

  const isOwner = data.currentRole === "owner";
  const canManageMembers = isOwner;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">General</h3>
          <p className="text-sm text-muted-foreground">
            Rename your workspace or set a logo URL.
          </p>
        </div>
        <Form {...settingsForm}>
          <form
            onSubmit={settingsForm.handleSubmit(saveSettings)}
            className="space-y-4"
          >
            <FormField
              control={settingsForm.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <div className="flex items-center gap-3">
                    <FormControl>
                      <Input {...field} disabled={!isOwner} />
                    </FormControl>
                    {isOwner ?
                      <EmojiPicker getValue={setSelectedEmoji}>
                        {selectedEmoji}
                      </EmojiPicker>
                    : <span className="text-2xl">{selectedEmoji}</span>}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={settingsForm.control}
              name="logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo</FormLabel>
                  <div className="flex flex-wrap items-center gap-3">
                    <Avatar className="size-10 rounded-md border">
                      <AvatarImage
                        src={field.value || undefined}
                        alt="Workspace logo"
                        className="object-cover"
                      />
                      <AvatarFallback className="rounded-md text-xs font-semibold">
                        {selectedEmoji}
                      </AvatarFallback>
                    </Avatar>
                    <FormControl>
                      <Input
                        className="min-w-0 flex-1 basis-40"
                        placeholder="https://... or upload an image"
                        disabled={!isOwner}
                        {...field}
                      />
                    </FormControl>
                    {isOwner && (
                      <>
                        <input
                          type="file"
                          ref={logoFileInputRef}
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="shrink-0 gap-1.5"
                          disabled={uploadingLogo}
                          onClick={() => logoFileInputRef.current?.click()}
                        >
                          {uploadingLogo ?
                            <HugeiconsIcon
                              icon={Loading03Icon}
                              strokeWidth={2}
                              className="size-4 animate-spin"
                            />
                          : <HugeiconsIcon
                              icon={Upload01Icon}
                              strokeWidth={2}
                              className="size-4"
                            />
                          }
                          {uploadingLogo ? "Uploading..." : "Upload logo"}
                        </Button>
                      </>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isOwner && (
              <Button
                type="submit"
                disabled={settingsForm.formState.isSubmitting}
              >
                Save changes
              </Button>
            )}
          </form>
        </Form>
      </section>

      <Separator />

      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Members</h3>
          <p className="text-sm text-muted-foreground">
            Owners can invite collaborators with editor or viewer access.
          </p>
        </div>

        <div className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={data.owner?.image ?? undefined} />
              <AvatarFallback>
                {(data.owner?.name ?? data.owner?.email ?? "O")
                  .slice(0, 1)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {data.owner?.name ?? data.owner?.email}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {data.owner?.email}
              </p>
            </div>
            <Badge>Owner</Badge>
          </div>

          {data.members.map((member) => (
            <div key={member.id} className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={member.image ?? undefined} />
                <AvatarFallback>
                  {(member.name ?? member.email).slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {member.name ?? member.email}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {member.email}
                </p>
              </div>
              {canManageMembers ?
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        size="sm"
                        variant="outline"
                        className="capitalize"
                        aria-label={`Change role for ${member.name ?? member.email}`}
                      >
                        {member.role}
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => changeRole(member.id, "editor")}
                    >
                      Editor
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => changeRole(member.id, "viewer")}
                    >
                      Viewer
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => removeMember(member.id)}
                    >
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              : <Badge variant="secondary" className="capitalize">
                  {member.role}
                </Badge>
              }
            </div>
          ))}

          {data.pendingInvites.length > 0 && (
            <div className="space-y-2 border-t pt-3">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Pending invites
              </p>
              {data.pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="min-w-0 truncate">{invite.email}</span>
                  <Badge variant="outline" className="capitalize">
                    {invite.role}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {canManageMembers && (
          <Form {...inviteForm}>
            <form
              onSubmit={inviteForm.handleSubmit(sendInvite)}
              className="grid gap-3 sm:grid-cols-[1fr_auto_auto]"
            >
              <FormField
                control={inviteForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="sm:col-span-1">
                    <FormLabel>Invite by email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={inviteForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        value={field.value}
                        onChange={field.onChange}
                      >
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={inviteForm.formState.isSubmitting}
                >
                  Invite
                </Button>
              </div>
            </form>
          </Form>
        )}
      </section>

      {isOwner && (
        <>
          <Separator />
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Danger zone</h3>
              <p className="text-sm text-muted-foreground">
                Transfer ownership or delete this workspace.
              </p>
            </div>

            <div className="space-y-3 rounded-lg border border-destructive/30 p-4">
              <div className="space-y-2">
                <Label htmlFor="transfer-member">Transfer ownership</Label>
                <select
                  id="transfer-member"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={transferTarget}
                  onChange={(event) => setTransferTarget(event.target.value)}
                >
                  <option value="">Select a collaborator</option>
                  {data.members.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.name ?? member.email}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!transferTarget}
                  onClick={confirmTransfer}
                >
                  Transfer ownership
                </Button>
              </div>

              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button variant="destructive">Delete workspace</Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete workspace?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently deletes all pages in the workspace. This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete}>
                      Delete workspace
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </section>
        </>
      )}

      {!isOwner && data.currentRole === "viewer" && (
        <p className="text-sm text-muted-foreground">
          You have viewer access. Ask the workspace owner for editor permissions
          to change pages.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Need another workspace?{" "}
        <Link href="/dashboard/new-workspace" className="underline">
          Create one
        </Link>
        .
      </p>
    </div>
  );
}
