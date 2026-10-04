"use client";

import React from "react";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";

import { GitHub, Google } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth/auth-client";
import { errorMessage } from "@/lib/error-message";

type OAuthButtonProps = {
  isFormDisabled: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  callbackURL: string;
};

export function OAuthButtons(props: OAuthButtonProps) {
  const { isFormDisabled, setIsSubmitting, callbackURL } = props;

  const [oauthLoading, setOauthLoading] = React.useState<"google" | "github">();

  async function oauthSignIn(provider: "google" | "github") {
    setOauthLoading(provider);
    setIsSubmitting(true);

    try {
      const result = await signIn.social({
        provider,
        callbackURL,
      });

      if (result.error) {
        toast.error(result.error.message ?? "Something went wrong.");
      }
    } catch (error) {
      console.error(errorMessage(error));
      toast.error("Something went wrong.");
    } finally {
      setIsSubmitting(false);
      setOauthLoading(undefined);
    }
  }

  return (
    <>
      <div className="relative py-2">
        <span className="absolute inset-x-0 inset-y-1/2 border-t" />

        <span className="relative mx-auto flex w-fit bg-background px-2 text-xs uppercase text-muted-foreground transition-colors duration-0">
          Or continue with
        </span>
      </div>

      <div className="mt-6 flex w-full flex-col space-y-2">
        <Button
          size="sm"
          onClick={() => oauthSignIn("google")}
          disabled={isFormDisabled}
          className="w-full font-semibold shadow-md"
        >
          {oauthLoading === "google" ?
            <HugeiconsIcon
              icon={Loading03Icon}
              strokeWidth={2}
              className="mr-2 size-4 animate-spin"
            />
          : <Google className="mr-2 size-4" />}
          Google
        </Button>

        <Button
          size="sm"
          onClick={() => oauthSignIn("github")}
          disabled={isFormDisabled}
          className="w-full font-semibold shadow-md"
        >
          {oauthLoading === "github" ?
            <HugeiconsIcon
              icon={Loading03Icon}
              strokeWidth={2}
              className="mr-2 size-4 animate-spin"
            />
          : <GitHub className="mr-2 size-4" />}
          GitHub
        </Button>
      </div>
    </>
  );
}
