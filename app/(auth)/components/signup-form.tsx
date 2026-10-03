"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  EyeIcon,
  EyeOffIcon,
  Loading03Icon,
  Mail01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { Route } from "next";
import type z from "zod";

import { TooltipDelayed } from "@/components/tooltip-delayed";
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
import { TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DEFAULT_LOGIN_REDIRECT } from "@/config/routes";
import { signUp } from "@/lib/auth/auth-client";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { getRedirectBaseURL } from "@/lib/auth/redirect-base-url";
import { signUpSchema } from "@/lib/validations";
import { OAuthButtons } from "./oauth-buttons";

type FormData = z.infer<typeof signUpSchema>;

const defaultValues: FormData = {
  email: "",
  password: "",
  confirmPassword: "",
};

export function SignUpForm() {
  const router = useRouter();
  const [isPassVisible, setIsPassVisible] = React.useState(false);
  const [isConfirmPassVisible, setIsConfirmPassVisible] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const searchParams = useSearchParams();
  const authError = searchParams.get("error");
  const callbackURL = getSafeRedirectPath(
    searchParams.get("from"),
    DEFAULT_LOGIN_REDIRECT,
    getRedirectBaseURL()
  );

  if (authError === "OAuthAccountNotLinked") {
    toast.error("OAuth Account Not Linked", {
      description: "This account is already linked with another provider.",
    });
  }

  const form = useForm<FormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues,
  });

  async function onSubmit(formData: FormData) {
    setIsSubmitting(true);

    try {
      const result = await signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.email.split("@")[0] ?? "",
        callbackURL,
      });

      if (result.error) {
        toast.error(result.error.message ?? "Something went wrong.");
        return;
      }

      toast.success("Account created successfully");
      router.push(callbackURL as Route);
      router.refresh();
    } catch (error) {
      const err = error as Error;
      console.error(err.message);
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
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
                <div className="relative">
                  <Input
                    type="email"
                    disabled={isSubmitting}
                    placeholder="you@domain.com"
                    className="shadow-sm"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="password"
          control={form.control}
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="sr-only">Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={isPassVisible ? "text" : "password"}
                    disabled={isSubmitting}
                    placeholder="••••••••••"
                    className="pr-8 shadow-sm"
                    {...field}
                  />
                  <TooltipDelayed delay={150}>
                    <TooltipTrigger
                      aria-label={
                        isPassVisible ? "Hide Password" : "Show Password"
                      }
                      type="button"
                      disabled={!field.value}
                      onClick={() => setIsPassVisible(!isPassVisible)}
                      className="absolute inset-y-0 right-2 my-auto text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                    >
                      {isPassVisible ?
                        <HugeiconsIcon
                          icon={EyeOffIcon}
                          strokeWidth={2}
                          className="size-5"
                        />
                      : <HugeiconsIcon
                          icon={EyeIcon}
                          strokeWidth={2}
                          className="size-5"
                        />
                      }
                    </TooltipTrigger>

                    <TooltipContent>
                      <p className="text-xs">
                        {isPassVisible ? "Hide Password" : "Show Password"}
                      </p>
                    </TooltipContent>
                  </TooltipDelayed>
                </div>
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
              <FormLabel className="sr-only">Confirm Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={isConfirmPassVisible ? "text" : "password"}
                    disabled={isSubmitting}
                    placeholder="••••••••••"
                    className="pr-8 shadow-sm"
                    {...field}
                  />
                  <TooltipDelayed delay={150}>
                    <TooltipTrigger
                      aria-label={
                        isConfirmPassVisible ? "Hide Password" : "Show Password"
                      }
                      type="button"
                      disabled={!field.value}
                      onClick={() =>
                        setIsConfirmPassVisible(!isConfirmPassVisible)
                      }
                      className="absolute inset-y-0 right-2 my-auto text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                    >
                      {isConfirmPassVisible ?
                        <HugeiconsIcon
                          icon={EyeOffIcon}
                          strokeWidth={2}
                          className="size-5"
                        />
                      : <HugeiconsIcon
                          icon={EyeIcon}
                          strokeWidth={2}
                          className="size-5"
                        />
                      }
                    </TooltipTrigger>

                    <TooltipContent>
                      <p className="text-xs">
                        {isConfirmPassVisible ?
                          "Hide Password"
                        : "Show Password"}
                      </p>
                    </TooltipContent>
                  </TooltipDelayed>
                </div>
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
          {isSubmitting ?
            <HugeiconsIcon
              icon={Loading03Icon}
              strokeWidth={2}
              className="mr-2 size-4 animate-spin"
            />
          : <HugeiconsIcon
              icon={Mail01Icon}
              strokeWidth={2}
              className="mr-2 size-4"
            />
          }
          Sign Up
        </Button>
      </form>

      <OAuthButtons
        isFormDisabled={isSubmitting}
        setIsSubmitting={setIsSubmitting}
        callbackURL={callbackURL}
      />
    </Form>
  );
}
