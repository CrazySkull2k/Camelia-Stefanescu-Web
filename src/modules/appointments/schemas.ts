import { z } from "zod";

export const publicAppointmentSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7).max(30),
  service: z.string().trim().min(2).max(160),
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().trim().regex(/^\d{2}:\d{2}$/),
  prima_vizita: z.enum(["Da", "Nu"]).optional(),
  turnstileToken: z.string().optional(),
  website: z.string().max(0).optional(),
});

export const appointmentStatusSchema = z.enum([
  "pending",
  "confirmed",
  "cancelled",
  "completed",
]);
