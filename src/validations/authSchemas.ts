import { z } from "zod";

const HOSTNAME_LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
const MAX_TLD_LENGTH = 6;

const hasValidEmailDomain = (email: string): boolean => {
  const atIndex = email.lastIndexOf("@");
  if (atIndex <= 0 || atIndex >= email.length - 1) {
    return false;
  }

  const labels = email.slice(atIndex + 1).split(".");
  if (labels.length < 2 || labels.some((label) => label.length === 0)) {
    return false;
  }

  const tld = labels[labels.length - 1];
  if (tld.length < 2 || tld.length > MAX_TLD_LENGTH || !/^[a-z]+$/i.test(tld)) {
    return false;
  }

  return labels.every((label) => label.length <= 63 && HOSTNAME_LABEL_RE.test(label));
};

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .max(254, "Email must be less than 254 characters long")
  .email({ message: "Please provide a valid email address" })
  .refine(hasValidEmailDomain, {
    message: "Please provide a valid email address",
  });

const passwordRequiredSchema = z.string().min(1, "Password is required");

export const strongPasswordSchema = z
  .string()
  .trim()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain uppercase, lowercase, number and special character")
  .regex(/[a-z]/, "Password must contain uppercase, lowercase, number and special character")
  .regex(/\d/, "Password must contain uppercase, lowercase, number and special character")
  .regex(/[^A-Za-z0-9]/, "Password must contain uppercase, lowercase, number and special character");

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordRequiredSchema,
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  email: emailSchema,
  password: strongPasswordSchema,
});

export type SignupFormValues = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
