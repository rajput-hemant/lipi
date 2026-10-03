"use client";

import React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loading03Icon, Mail01Icon } from "@hugeicons/core-free-icons";
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
import { requestPasswordReset } from "@/lib/auth/auth-client";
import { forgotPasswordSchema } from "@/lib/validations";

type FormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSent, setIsSent] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit({ email }: FormData) {
    setIsSubmitting(true);

    try {
      const result = await requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });

      if (result.error) {
        toast.error("Could not send the email. Please try again later.");
        return;
      }

      setIsSent(true);
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSent) {
    return (
      <div className="mt-4 space-y-4">
        <p role="status" className="text-sm">
          If an account exists for that email, we sent a link to reset your
          password. It expires in 1 hour.
        </p>
        <Link
          href="/login"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-2">
        <FormField
          name="email"
          control={form.control}
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="sr-only">Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  disabled={isSubmitting}
                  placeholder="you@domain.com"
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
            icon={isSubmitting ? Loading03Icon : Mail01Icon}
            strokeWidth={2}
            className={
              isSubmitting ? "mr-2 size-4 animate-spin" : "mr-2 size-4"
            }
          />
          Send reset link
        </Button>

        <Link
          href="/login"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "w-full",
          })}
        >
          Back to login
        </Link>
      </form>
    </Form>
  );
}
