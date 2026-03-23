import { z } from "zod";

const SUPPORTED_LANGUAGES = ['th', 'zh', 'vi'] as const;

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name must be 50 characters or fewer"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name must be 50 characters or fewer"),
  email: z.string().email("Invalid email"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be 100 characters or fewer")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[!@#$%^&*]/, "Password must contain at least one special character (!@#$%^&*)"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username must be 30 characters or fewer"),
  native_language: z.enum(SUPPORTED_LANGUAGES).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type RegisterFormData = z.infer<typeof registerSchema>;
export { SUPPORTED_LANGUAGES };
