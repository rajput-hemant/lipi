import Image from "next/image";
import { redirect } from "next/navigation";
import { toast } from "sonner";

import { getCurrentUser } from "@/lib/auth";
import { getUserSubscription } from "@/lib/db/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WorkspaceForm } from "./workspace-form";

export const metadata = {
  title: "Create a workspace",
  description: "Create a new workspace to organize your projects.",
};

export default async function WorkspaceSetupPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  const { data: subscription, error } = await getUserSubscription(user.id);

  if (error != null) {
    console.error(error);

    toast.error("An unexpected error occurred", {
      description:
        "Unable to fetch your subscription status. Please try again later.",
    });
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <section className="dark relative hidden h-full w-full items-center justify-center lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />

        <Image
          priority
          src="/illustrations/office-cubicle.svg"
          alt="Get started"
          width={450}
          height={450}
          className="invert"
        />
      </section>

      <Separator orientation="vertical" />

      <section className="flex h-full w-full flex-col items-center justify-center gap-14 px-4">
        <h1 className="text-center font-heading text-4xl font-bold [text-shadow:_0_4px_0_#e1e1e1] dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent dark:[text-shadow:none] sm:text-5xl md:text-6xl">
          Create your first
          <br />
          workspace
        </h1>

        <Card className="z-10 h-fit w-full max-w-xl shadow-lg">
          <CardHeader>
            <CardTitle>Create a new workspace.</CardTitle>
            <CardDescription>
              Workspaces are where you can organize your projects and invite
              collaborators.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <WorkspaceForm user={user} subscription={subscription!} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
