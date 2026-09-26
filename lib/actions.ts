"use server";

import { redirect } from "next/navigation";
import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";

import type { resetPasswordSchema } from "./validations";
import type { z } from "zod";

import { db } from "./db";
import { betterAuthAccounts, users } from "./db/schema";

export async function resetPassword(
  credentials: z.infer<typeof resetPasswordSchema>,
) {
  const { email, password, newPassword } = credentials;

  const user = await db.query.users.findFirst({
    where: (u, { eq: equals }) => equals(u.email, email),
  });

  if (!user) {
    throw new Error("User not found, please try signing up");
  }

  const credentialAccount = await db.query.betterAuthAccounts.findFirst({
    where: eq(betterAuthAccounts.userId, user.id),
  });

  const storedHash = credentialAccount?.password ?? user.password;

  if (!storedHash) {
    throw new Error(
      "User does not have a password, you might have signed up with a social account",
    );
  }

  const isPasswordValid = await compare(password, storedHash);

  if (!isPasswordValid) {
    throw new Error("Previous password is incorrect, please try again");
  }

  const hashedPassword = await hash(newPassword, 10);

  if (credentialAccount) {
    await db
      .update(betterAuthAccounts)
      .set({ password: hashedPassword })
      .where(eq(betterAuthAccounts.userId, user.id));
  }

  await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.email, email));

  redirect("/login");
}
