"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import type { User } from "next-auth";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import type { Subscription } from "@/types/db";
import { createWorkspace } from "@/lib/db/queries";
import { EmojiPicker } from "@/components/emoji-picker";
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

const workspaceSchema = z.object({
  name: z.string().min(3, "Workspace name must be at least 3 characters long"),
});

type FormData = z.infer<typeof workspaceSchema>;

type WorkspaceFormProps = {
  user: User;
  subscription: Subscription;
};

export function WorkspaceForm({ user, subscription }: WorkspaceFormProps) {
  const router = useRouter();
  const [selectedEmoji, setSelectedEmoji] = React.useState("💼");

  const form = useForm<FormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { name: "" },
    mode: "onChange",
  });

  async function submitHandler({ name }: FormData) {
    console.log({ name });

    const { data, error } = await createWorkspace({
      title: name,
      iconId: selectedEmoji,
      workspaceOwnerId: user.id,
    });

    if (data) {
      toast.success("Workspace created", {
        description: `Your workspace "${name}" was created successfully.`,
      });

      router.replace(`/dashboard/${data.id}`);
    }

    if (error) {
      console.log(error, "Error");

      toast.error("Could not create your workspace", {
        description:
          "Oops! Something went wrong, and we couldn't create your workspace. Try again or come back later.",
      });
    }
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

        {subscription.status !== "active" && (
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
              <Loader2 className="h-4 w-4 animate-spin" />
            : "Create workspace"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
