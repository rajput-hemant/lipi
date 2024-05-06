import { SignUpForm } from "../components/signup-form";

export const metadata = {
  title: "Sign Up",
  description: "Sign up to access your account",
};

export default function SignupPage() {
  return (
    <div className="flex flex-col space-y-2 text-center">
      <h1 className="font-heading text-3xl drop-shadow-xl dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-4xl">
        Create an account
      </h1>
      <p className="text-sm text-muted-foreground">
        Enter your email below to create your account
      </p>

      <SignUpForm />
    </div>
  );
}
