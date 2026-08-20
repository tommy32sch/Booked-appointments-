import { z } from "zod";
import { OUTREACH_CHANNELS, SITE_TYPES } from "./types.js";

export const addressSchema = z
  .object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional()
  })
  .optional();

export const decisionMakerSchema = z
  .object({
    name: z.string().optional(),
    title: z.string().optional(),
    public_linkedin: z.string().optional()
  })
  .optional();

export const publicContactSchema = z
  .object({
    email: z.string().optional(),
    phone: z.string().optional(),
    website: z.string().optional()
  })
  .optional();

export const rawTargetSchema = z.object({
  id: z.string().optional(),
  example: z.boolean().optional(),
  source: z.string().optional(),
  source_note: z.string().optional(),
  name: z.string().optional(),
  site_type: z.union([z.enum(SITE_TYPES), z.string()]).optional(),
  address: addressSchema,
  decision_maker: decisionMakerSchema,
  public_contact: publicContactSchema,
  notes: z.string().optional()
});

export const playbookInputSchema = z.object({
  vertical: z.string().optional()
});

export const findTargetsInputSchema = z.object({
  records: z.array(rawTargetSchema).optional(),
  geo: z.string().optional(),
  persist: z.boolean().optional(),
  store_path: z.string().optional()
});

export const listTargetsInputSchema = z.object({
  store_path: z.string().optional(),
  include_examples: z.boolean().optional()
});

export const scoreTargetInputSchema = z.object({
  id: z.string().optional(),
  target: rawTargetSchema.optional(),
  store_path: z.string().optional()
});

export const draftOutreachInputSchema = z.object({
  id: z.string().optional(),
  target: rawTargetSchema.optional(),
  channel: z.enum(OUTREACH_CHANNELS).optional(),
  buyer_name: z.string().optional(),
  store_path: z.string().optional()
});

export const calendarBookingInputSchema = z.object({
  id: z.string().optional(),
  target: rawTargetSchema.optional(),
  store_path: z.string().optional(),
  proposed_slots: z.array(z.string()).optional()
});

export type PlaybookInput = z.infer<typeof playbookInputSchema>;
export type FindTargetsInput = z.infer<typeof findTargetsInputSchema>;
export type ListTargetsInput = z.infer<typeof listTargetsInputSchema>;
export type ScoreTargetInput = z.infer<typeof scoreTargetInputSchema>;
export type DraftOutreachInput = z.infer<typeof draftOutreachInputSchema>;
export type CalendarBookingInput = z.infer<typeof calendarBookingInputSchema>;
