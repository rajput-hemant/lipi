import type { z } from "zod";

import type { loginSchema } from "@/lib/validations";

export type LoginFormValues = z.infer<typeof loginSchema>;

export function buildLoginFormStateAfterToggle(
  isEmailMode: boolean,
  password: string,
): LoginFormValues {
  const nextIsEmail = !isEmailMode;

  if (nextIsEmail) {
    return { type: "email", email: "", password };
  }

  return { type: "username", username: "", password };
}
