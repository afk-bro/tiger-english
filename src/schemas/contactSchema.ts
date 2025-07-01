// schemas/contactSchema.ts
import { z } from "zod";

export const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;