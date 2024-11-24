"use client";

import { useActionState } from "react";
import { CheckCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

type Form = {
  errors?: string[];
  message: string | null;
  subscribed: boolean;
};

export function NewsletterSubscriptionForm() {
  const initialState: Form = {
    errors: [],
    message: null,
    subscribed: false,
  };

  const [state, formAction] = useActionState(
    subscribeToNewsletter,
    initialState
  );

  async function subscribeToNewsletter(_: Form, _formData: FormData) {
    // TODO: Add newsletter subscription logic here.
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1500)), {
      loading: "Subscribing...",
      error: "Something went wrong.",
      success: "You have successfully subscribed to our newsletter.",
    });

    return {
      errors: [],
      message: null,
      subscribed: true,
    };
  }

  return (
    <form action={formAction}>
      <div className={cn("relative", state.subscribed && "hidden")}>
        <Input
          name="email"
          placeholder="you@domain.com"
          type="email"
          required
          aria-describedby="email-validation"
          className="pr-[100px] transition-shadow duration-200 hover:shadow"
        />

        <SubmitButton />
      </div>

      <div id="email-validation" aria-live="polite">
        {state.errors?.map((error: string) => (
          <p key={error} className="ml-1 mt-1 text-sm text-destructive">
            {error}
          </p>
        ))}

        {state.message && (
          <p className="ml-1 mt-1 text-sm text-destructive">{state.message}</p>
        )}

        {state.subscribed && (
          <p className="mt-2 flex flex-row items-center gap-1.5 text-sm duration-300 animate-in slide-in-from-right-full">
            <CheckCircle className="h-5 text-green-600" aria-hidden="true" />
            Thanks for subscribing!
          </p>
        )}
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="secondary"
      size="sm"
      className="absolute inset-y-1 right-1 h-8 border text-xs"
      aria-disabled={pending}
      disabled={pending}
    >
      {pending ? "Subscribing..." : "Subscribe"}
    </Button>
  );
}
