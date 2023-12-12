"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { User } from "next-auth";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { Subscription } from "@/types/db";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/constants";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const workspaceSchema = z.object({
  name: z.string().min(3, "Workspace name must be at least 3 characters long"),
  logo: z
    .instanceof(FileList)
    .refine((files) => files?.length == 1, "File is required.")
    .refine((files) => files[0]?.size <= 1024 * 1024, `Max file size is 1MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
});

type FormData = z.infer<typeof workspaceSchema>;

type WorkspaceFormProps = {
  user: User;
  subscriptionStatus: Subscription["status"];
};

export function WorkspaceForm({
  user,
  subscriptionStatus,
}: WorkspaceFormProps) {
  const [selectedEmoji, setSelectedEmoji] = React.useState("💼");

  const form = useForm<FormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { name: "", logo: undefined },
    mode: "onChange",
  });

  async function submitHandler({ name, logo }: FormData) {
    console.log({ name, logo });
    // TODO: Create workspace logic
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
                <div className="flex items-center justify-between gap-10">
                  <Input
                    placeholder="Workspace name"
                    className="shadow-sm"
                    {...field}
                  />
                  <div className="-mt-1 text-4xl">
                    <Tooltip>
                      <TooltipTrigger>
                        <EmojiPicker getValue={setSelectedEmoji}>
                          {selectedEmoji}
                        </EmojiPicker>
                      </TooltipTrigger>
                      <TooltipContent>
                        Select an emoji to represent your workspace.
                      </TooltipContent>
                    </Tooltip>
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
        <FormField
          name="logo"
          control={form.control}
          render={() => (
            <FormItem>
              <FormLabel>Workspace logo</FormLabel>
              <Input
                type="file"
                accept="image/*"
                placeholder="Workspace Logo"
                className="shadow-sm"
                {...form.register("logo", { required: true })}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        {subscriptionStatus !== "active" && (
          <small className="my-2 block text-center text-xs text-muted-foreground">
            To customize your workspace, you need to be on a Pro Plan
          </small>
        )}
        <div className="flex pt-4">
          <Button type="submit" className="ml-auto shadow-md">
            Create workspace
          </Button>
        </div>
      </form>
    </Form>
  );
}
