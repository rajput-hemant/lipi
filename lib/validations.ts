import * as z from "zod";

export const authSchema = z
  .object({
    username: z
      .string()
      .min(1, "Username is Required")
      .regex(/^(?=.{8,15}$)/, "Username must be 8-15 characters long.")
      .regex(/^[a-zA-Z0-9]+$/, "Username must be alphanumeric.")
      // TODO: conditionally add optional if email is present
      .optional(),
    email: z
      .string()
      .min(1, "Email is Required")
      .email("Please enter a valid email")
      // TODO: conditionally add optional if username is present
      .optional(),
    password: z
      .string()
      .min(1, "Password is Required")
      .regex(/^(?!\s*$).+/, "Password must not contain Whitespaces.")
      .regex(
        /^(?=.*[A-Z])/,
        "Password must contain at least one uppercase letter."
      )
      .regex(
        /^(?=.*[a-z])/,
        "Password must contain at least one lowercase letter."
      )
      .regex(/^(?=.*\d)/, "Password must contain at least one number.")
      .regex(
        /^(?=.*[~`!@#$%^&*()--+={}[\]|\\:;"'<>,.?/_₹])/,
        "Password must contain at least one special character."
      )
      .min(8, "Password must be at least 8 characters long."),
    confirmPassword: z.string().optional(),
  })
  .refine(
    ({ password, confirmPassword }) =>
      !confirmPassword || password === confirmPassword,
    {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    }
  );
