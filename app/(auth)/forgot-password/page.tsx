import { ForgotPasswordForm } from "../components/forgot-password-form";

export const metadata = {
  title: "Forgot password",
  description: "Get a link to reset your password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col space-y-2 text-center">
      <h1 className="font-heading text-3xl drop-shadow-xl dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-4xl">
        Forgot password
      </h1>

      <p className="text-sm text-muted-foreground">
        Enter your email and we will send you a link to reset your password
      </p>

      <ForgotPasswordForm />
    </div>
  );
}
