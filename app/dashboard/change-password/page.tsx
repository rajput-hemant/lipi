import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChangePasswordForm } from "./change-password-form";

export const metadata = {
  title: "Change password",
  description: "Change the password you use to sign in.",
};

export const instant = false;

export default function ChangePasswordPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-dvh items-center justify-center px-4 py-10 outline-none"
    >
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>
            Enter your current password and choose a new one. Other devices will
            be signed out.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </main>
  );
}
