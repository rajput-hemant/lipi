import React from "react";
import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { Logo } from "@/components/icons";

export default function AuthLayout({ children }: React.PropsWithChildren) {
  return (
    <div className="container h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col justify-between border-r p-10 lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />

        <div className="z-10 font-handwriting text-2xl font-medium lowercase text-background dark:text-foreground">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} />
            {siteConfig.name}
          </Link>
        </div>

        <div className="m-auto">
          <Image
            src="/illustrations/success.svg"
            alt="Get started"
            width={500}
            height={500}
            className="drop-shadow-xl invert"
          />
        </div>

        <div className="z-10 ml-auto text-muted-foreground">
          <p className="text-sm">
            Illustrations by{" "}
            <a
              href="https://popsy.co/"
              className="underline underline-offset-4 transition-colors hover:text-background dark:hover:text-foreground"
            >
              Popsy
            </a>
            .
          </p>
        </div>
      </div>

      <div className="relative my-auto flex h-full lg:p-8">
        <div className="z-10 mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[550px]">
          <Logo size={56} className="mx-auto" />

          {children}

          <p className="mx-auto w-[350px] px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <Link
              href="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
