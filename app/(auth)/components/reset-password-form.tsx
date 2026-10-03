"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Key01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/lib/auth/auth-client";
import { resetPasswordSchema } from "@/lib/validations";

type FormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  async function onSubmit({ newPassword }: FormData) {
    setIsSubmitting(true);

    try {
      const result = await resetPassword({ newPassword, token });

      if (result.error) {
        toast.error(result.error.message ?? "Something went wrong.");
        return;
      }

      toast.success("Password updated. Please sign in.");
      router.push("/login");
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-2">
        <FormField
          name="newPassword"
          control={form.control}
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="sr-only">New password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  placeholder="New password"
                  className="shadow-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="confirmPassword"
          control={form.control}
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="sr-only">Confirm new password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  placeholder="Confirm new password"
                  className="shadow-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting}
          className="w-full font-semibold shadow-md"
        >
          <HugeiconsIcon
            icon={isSubmitting ? Loading03Icon : Key01Icon}
            strokeWidth={2}
            className={
              isSubmitting ? "mr-2 size-4 animate-spin" : "mr-2 size-4"
            }
          />
          Reset password
        </Button>
      </form>
    </Form>
  );
}
