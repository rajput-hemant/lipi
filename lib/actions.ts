"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "./db";
import { users } from "./db/schema";

type Credentials = EmailCredentials | UsernameCredentials;

type EmailCredentials = {
  mode: "email";
  email: string;
  password: string;
};

type UsernameCredentials = {
  mode: "username";
  username: string;
  password: string;
};

export async function createNewAccount(credentials: Credentials) {
  if (credentials.mode === "email") {
    const { email, password } = credentials;

    try {
      const hashedPassword = await hash(password, 10);

      const user = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, email),
      });

      if (user) {
        return { error: "Email already exists, please try logging in" };
      }

      await db
        .insert(users)
        .values({ username: randomUUID(), email, password: hashedPassword });
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }

  redirect("/dashboard");
}

export async function resetPassword(credentials: Credentials) {
  try {
    const hashedPassword = await hash(credentials.password, 10);

    const updatedPass = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(
        credentials.mode === "email" ?
          eq(users.email, credentials.email)
        : eq(users.username, credentials.username)
      )
      .returning({ updatedPass: users.password });

    if (updatedPass.length === 0) {
      throw new Error("User not found, please try signing up");
    }
  } catch (error) {
    throw new Error((error as Error).message);
  }

  redirect("/login");
}
