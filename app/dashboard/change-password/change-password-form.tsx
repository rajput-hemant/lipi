"use client";

import React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Key01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type z from "zod";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DEFAULT_LOGIN_REDIRECT } from "@/config/routes";
import { changePassword } from "@/lib/auth/auth-client";
import { changePasswordSchema } from "@/lib/validations";

type FormData = z.infer<typeof changePasswordSchema>;

const defaultValues: FormData = { currentPassword: "", newPassword: "" };

export function ChangePasswordForm() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues,
  });

  async function onSubmit(formData: FormData) {
    setIsSubmitting(true);

    try {
      const result = await changePassword({
        ...formData,
        revokeOtherSessions: true,
      });

      if (result.error) {
        toast.error(result.error.message ?? "Something went wrong.");
        return;
      }

      toast.success("Password changed successfully");
      form.reset(defaultValues);
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          name="currentPassword"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="newPassword"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between gap-2">
          <Link
            href={DEFAULT_LOGIN_REDIRECT}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Back to dashboard
          </Link>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            <HugeiconsIcon
              icon={isSubmitting ? Loading03Icon : Key01Icon}
              strokeWidth={2}
              className={
                isSubmitting ? "mr-2 size-4 animate-spin" : "mr-2 size-4"
              }
            />
            Change password
          </Button>
        </div>
      </form>
    </Form>
  );
}
