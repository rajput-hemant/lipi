"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import type { User } from "next-auth";

import { EmojiPicker } from "@/components/emoji-picker";
import { useSubscriptionModal } from "@/components/subscription-modal-provider";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createWorkspace } from "@/lib/db/queries";

const workspaceSchema = z.object({
  name: z.string().min(3, "Workspace name must be at least 3 characters long"),
});

type FormData = z.infer<typeof workspaceSchema>;

type WorkspaceFormProps = { user: User };

export function WorkspaceForm({ user }: WorkspaceFormProps) {
  const router = useRouter();
  const { subscription } = useSubscriptionModal();

  const [selectedEmoji, setSelectedEmoji] = React.useState("💼");

  const form = useForm<FormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { name: "" },
    mode: "onChange",
  });

  async function submitHandler({ name }: FormData) {
    toast.promise(
      createWorkspace({
        title: name,
        iconId: selectedEmoji,
        workspaceOwnerId: user.id!,
      }),
      {
        loading: `Creating your workspace "${name}"`,
        success: (data) => {
          router.replace(`/dashboard/${data.id}`);
          return `Your workspace "${name}" was created successfully.`;
        },
        error: (e) => e.message,
      }
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submitHandler)} className="space-y-2">
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <div className="w-full space-y-2">
                <FormLabel>Name</FormLabel>
                <div className="flex items-center justify-between gap-4">
                  <Input
                    placeholder="Workspace name"
                    disabled={form.formState.isSubmitting}
                    className="shadow-sm"
                    {...field}
                  />
                  <div className="-mt-1 text-4xl">
                    <EmojiPicker getValue={setSelectedEmoji}>
                      {selectedEmoji}
                    </EmojiPicker>
                  </div>
                </div>
                <FormDescription>
                  You can change this later in your workspace settings.
                </FormDescription>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {subscription?.status !== "active" && (
          <small className="block pt-4 text-center text-xs text-muted-foreground">
            To customize your workspace, you need to be on a Pro Plan
          </small>
        )}
        <div className="flex pt-4">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="ml-auto w-40 shadow-md"
          >
            {form.formState.isSubmitting ?
              <Loader2 className="size-4 animate-spin" />
            : "Create workspace"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
