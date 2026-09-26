"use server";

import { redirect } from "next/navigation";
import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";

import type { resetPasswordSchema } from "./validations";
import type { z } from "zod";

import {
  findCredentialAccount,
  resolveStoredPasswordHash,
  upsertCredentialPassword,
} from "./auth/credential-account";
import { db } from "./db";
import { users } from "./db/schema";

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

  const credentialAccount = await findCredentialAccount(user.id);
  const storedHash = resolveStoredPasswordHash(
    credentialAccount?.password,
    user.password,
  );

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

  await upsertCredentialPassword(user.id, hashedPassword);

  await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.email, email));

  redirect("/login");
}
