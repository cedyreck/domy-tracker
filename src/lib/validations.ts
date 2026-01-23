import { z } from "zod";

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(100, { message: "Password must be less than 100 characters" }),
});

export const signUpSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(100, { message: "Password must be less than 100 characters" }),
  username: z
    .string()
    .trim()
    .min(3, { message: "Username must be at least 3 characters" })
    .max(30, { message: "Username must be less than 30 characters" })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: "Username can only contain letters, numbers, and underscores",
    }),
  inviteToken: z.string().optional(),
});

export const updateBalanceSchema = z.object({
  balance: z
    .number()
    .int({ message: "Balance must be a whole number" })
    .min(-9999, { message: "Balance cannot be less than -9999" })
    .max(9999, { message: "Balance cannot be more than 9999" }),
});

export const generateTokenSchema = z.object({
  expiresAt: z.date().optional(),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type UpdateBalanceInput = z.infer<typeof updateBalanceSchema>;
export type GenerateTokenInput = z.infer<typeof generateTokenSchema>;
