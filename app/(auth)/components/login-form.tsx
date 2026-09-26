"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AtSignIcon,
  EyeIcon,
  EyeOffIcon,
  FingerPrintIcon,
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
import { signIn } from "@/lib/auth/auth-client";
import { buildLoginFormStateAfterToggle } from "@/lib/auth/login-toggle";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { getRedirectBaseURL } from "@/lib/auth/redirect-base-url";
import { loginSchema } from "@/lib/validations";
import { OAuthButtons } from "./oauth-buttons";

type FormData = z.infer<typeof loginSchema>;

const defaultValues: FormData = {
  type: "email",
  email: "",
  password: "",
};

export function LoginForm() {
  const router = useRouter();
  const [isEmailMode, setIsEmailMode] = React.useState(true);
  const [isPassVisible, setIsPassVisible] = React.useState(false);
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
    resolver: zodResolver(loginSchema),
    defaultValues,
  });

  function toggleLoginMode() {
    const password = form.getValues("password");
    const nextValues = buildLoginFormStateAfterToggle(isEmailMode, password);
    setIsEmailMode(nextValues.type === "email");
    form.reset(nextValues);
  }

  async function onSubmit(formData: FormData) {
    setIsSubmitting(true);

    try {
      const result =
        formData.type === "email" ?
          await signIn.email({
            email: formData.email,
            password: formData.password,
            callbackURL,
          })
        : await signIn.username({
            username: formData.username,
            password: formData.password,
            callbackURL,
          });

      if (result.error) {
        toast.error(result.error.message ?? "Something went wrong.");
        return;
      }

      toast.success("You have been signed in.");
      router.push(callbackURL as Route);
      router.refresh();
    } catch (error) {
      const err = error as Error;
      console.error(err.message);
      toast.error("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-2">
        <FormField
          name={isEmailMode ? "email" : "username"}
          control={form.control}
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="sr-only">
                {isEmailMode ? "Email" : "Username"}
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={isEmailMode ? "email" : "text"}
                    disabled={isSubmitting}
                    placeholder={isEmailMode ? "you@domain.com" : "@username"}
                    className="pr-8 shadow-sm"
                    {...field}
                  />
                  <TooltipDelayed delay={150}>
                    <TooltipTrigger
                      aria-label={
                        isEmailMode ?
                          "Use Username instead"
                        : "Use Email instead"
                      }
                      tabIndex={-1}
                      type="button"
                      onClick={toggleLoginMode}
                      className="absolute inset-y-0 right-2 my-auto text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                    >
                      {isEmailMode ?
                        <HugeiconsIcon
                          icon={AtSignIcon}
                          strokeWidth={2}
                          className="size-5"
                        />
                      : <HugeiconsIcon
                          icon={Mail01Icon}
                          strokeWidth={2}
                          className="size-5"
                        />
                      }
                    </TooltipTrigger>

                    <TooltipContent>
                      <p className="text-xs">
                        {isEmailMode ?
                          "Use Username instead"
                        : "Use Email instead"}
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
                      tabIndex={-1}
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
          : isEmailMode ?
            <HugeiconsIcon
              icon={Mail01Icon}
              strokeWidth={2}
              className="mr-2 size-4"
            />
          : <HugeiconsIcon
              icon={FingerPrintIcon}
              strokeWidth={2}
              className="mr-2 size-4"
            />
          }

          {isEmailMode ? "Login with Email" : "Login"}
        </Button>
      </form>

      <p className="mx-auto mt-2 text-xs text-muted-foreground hover:text-foreground">
        <Link
          href="/reset-password"
          className="underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
        >
          Forgot password?
        </Link>
      </p>

      <OAuthButtons
        isFormDisabled={isSubmitting}
        setIsSubmitting={setIsSubmitting}
        callbackURL={callbackURL}
      />
    </Form>
  );
}
