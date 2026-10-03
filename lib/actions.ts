"use server";

import { redirect } from "next/navigation";
import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";

import type { z } from "zod";

import {
  findCredentialAccount,
  resolveStoredPasswordHash,
  upsertCredentialPassword,
} from "./auth/credential-account";
import { db } from "./db";
import { users } from "./db/schema";
import { resetPasswordSchema } from "./validations";

const RESET_PASSWORD_FAILURE_MESSAGE =
  "Email or current password is incorrect, please try again";

// Compared against when no stored hash exists so every failure costs one bcrypt.
const DUMMY_PASSWORD_HASH =
  "$2b$10$hrRBRjfhAMvWbJjeLTvlQeFnhOplSFtoT01N2jf0USdZKT68RN8N.";

export async function resetPassword(
  credentials: z.infer<typeof resetPasswordSchema>
) {
  const parsed = resetPasswordSchema.safeParse(credentials);
  if (!parsed.success) {
    throw new Error(RESET_PASSWORD_FAILURE_MESSAGE);
  }
  const { email, password, newPassword } = parsed.data;

  const user = await db.query.users.findFirst({
    where: (u, { eq: equals }) => equals(u.email, email),
  });

  const credentialAccount =
    user ? await findCredentialAccount(user.id) : undefined;
  const storedHash = resolveStoredPasswordHash(
    credentialAccount?.password,
    user?.password
  );

  // One generic failure for unknown email, social-only account or wrong password.
  const isPasswordValid = await compare(
    password,
    storedHash ?? DUMMY_PASSWORD_HASH
  );

  if (!user || !storedHash || !isPasswordValid) {
    throw new Error(RESET_PASSWORD_FAILURE_MESSAGE);
  }

  const hashedPassword = await hash(newPassword, 10);

  await upsertCredentialPassword(user.id, hashedPassword);

  await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.email, email));

  redirect("/login");
}
