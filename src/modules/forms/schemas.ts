import { z } from "zod";

export const questionnaireSubmissionSchema = z
  .object({
    event_id: z.string().trim().min(1),
    name: z.string().trim().min(2).max(120),
    age: z.string().trim().optional(),
    birth_date: z.string().trim().optional(),
    sex: z.string().trim().optional(),
    marital_status: z.string().trim().optional(),
    children: z.string().trim().optional(),
    height: z.string().trim().optional(),
    weight: z.string().trim().optional(),
    ideal_weight: z.string().trim().optional(),
  })
  .catchall(z.any());
