export const SITE_TYPES = [
  "office",
  "warehouse",
  "restaurant",
  "facility",
  "property",
  "other"
] as const;

export type SiteType = (typeof SITE_TYPES)[number];

export const TARGET_SOURCES = ["agent_ingest", "example"] as const;
export type TargetSource = (typeof TARGET_SOURCES)[number];

export const OUTREACH_CHANNELS = ["email", "phone", "linkedin"] as const;
export type OutreachChannel = (typeof OUTREACH_CHANNELS)[number];

export type Address = {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
};

export type DecisionMaker = {
  name?: string;
  title?: string;
  public_linkedin?: string;
};

export type PublicContact = {
  email?: string;
  phone?: string;
  website?: string;
};

/**
 * Structured public record the calling agent already has.
 * This product does not fetch Maps/LinkedIn/etc.
 */
export type RawTarget = {
  id?: string;
  example?: boolean;
  source?: TargetSource | string;
  source_note?: string;
  name?: string;
  site_type?: SiteType | string;
  address?: Address;
  decision_maker?: DecisionMaker;
  public_contact?: PublicContact;
  notes?: string;
};

export type Target = {
  id: string;
  source: TargetSource;
  source_note: string;
  example: boolean;
  name: string;
  site_type?: SiteType;
  address?: Address;
  decision_maker?: DecisionMaker;
  public_contact?: PublicContact;
  notes?: string;
  ingested_at: string;
};

export type Qualification = "qualified" | "review" | "disqualified";

export type ScoreDimension = {
  id: string;
  label: string;
  points: number;
  max: number;
  note: string;
};

export type TargetScore = {
  target_id: string;
  qualification: Qualification;
  score: number;
  max_score: number;
  dimensions: ScoreDimension[];
  rejects: string[];
  reasons: string[];
  example: boolean;
  note: string;
};

export const TOOL_NAMES = [
  "playbook",
  "find_targets",
  "list_targets",
  "score_target",
  "draft_outreach",
  "send_outreach",
  "calendar_booking"
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

export const CLI_COMMANDS = [
  "playbook",
  "find-targets",
  "list-targets",
  "score-target",
  "draft-outreach",
  "send-outreach",
  "calendar-booking"
] as const;

export const DEFAULT_STORE_PATH = ".booked-appointments/store.json";
export const DEFAULT_VERTICAL = "janitorial";
