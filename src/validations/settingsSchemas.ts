import { z } from "zod";
import { emailSchema } from "./authSchemas";

const optionalNonEmptyString = z.string().trim().optional();

export const settingsSaveSchema = z.object({
  smtp_host: optionalNonEmptyString,
  smtp_port: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^\d{1,5}$/.test(v), { message: "SMTP port must be a valid number" }),
  smtp_user: optionalNonEmptyString,
  smtp_pass: optionalNonEmptyString,
  smtp_from: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, {
      message: "From address must be a valid email",
    }),
  email_recipients: z
    .string()
    .trim()
    .optional()
    .refine(
      (v) => {
        if (!v) return true;
        const parts = v.split(",").map((s) => s.trim()).filter(Boolean);
        return parts.every((p) => emailSchema.safeParse(p).success);
      },
      { message: "Recipients must be comma-separated valid email addresses" },
    ),
  auto_skip_trace: z.enum(["true", "false"]).optional(),
  bright_data_user: optionalNonEmptyString,
  scraper_api_key: optionalNonEmptyString,
  skip_trace_key: optionalNonEmptyString,
  bright_data_pass: optionalNonEmptyString,
  attom_api_key: optionalNonEmptyString,
});

export type SettingsSaveFormValues = z.infer<typeof settingsSaveSchema>;

export const testEmailSchema = z.object({
  email: emailSchema,
});

export type TestEmailFormValues = z.infer<typeof testEmailSchema>;
