import { AuthForm } from "../components/auth-form";

export const metadata = {
  title: "Reset Password",
  description: "Reset your password",
};

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col space-y-2 text-center">
      <h1 className="font-heading text-3xl drop-shadow-xl sm:text-4xl dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent">
        Reset Password
      </h1>
      <p className="text-sm text-muted-foreground">
        Enter your new password below.
      </p>

      <div className="px-8 sm:mx-auto sm:w-[350px] sm:px-0">
        <AuthForm mode="reset" />
      </div>
    </div>
  );
}
