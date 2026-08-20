import { createHash } from "node:crypto";
import { SITE_TYPES, type RawTarget, type SiteType, type Target, type TargetSource } from "./types.js";

export const EXAMPLE_SOURCE_NOTE =
  "Example record with no source. Not a real customer. For tests and agent dry-runs only.";

export const AGENT_INGEST_SOURCE_NOTE =
  "Provided by the calling agent as a structured public record. Not independently verified by this product. Not fetched from Maps/LinkedIn APIs.";

const SITE_TYPE_SET = new Set<string>(SITE_TYPES);

export function isSiteType(value: string): value is SiteType {
  return SITE_TYPE_SET.has(value);
}

export function looksLikeExample(raw: RawTarget): boolean {
  if (raw.example === true) return true;
  if (raw.source === "example") return true;
  const name = (raw.name ?? "").toLowerCase();
  if (name.startsWith("example ") || name.includes(" example")) return true;
  const note = (raw.source_note ?? "").toLowerCase();
  if (note.includes("example") && note.includes("no source")) return true;
  return false;
}

export function normalizeSiteType(value?: string): SiteType | undefined {
  if (!value) return undefined;
  const lowered = value.trim().toLowerCase();
  if (isSiteType(lowered)) return lowered;
  if (lowered.includes("warehouse") || lowered.includes("industrial")) return "warehouse";
  if (lowered.includes("restaurant") || lowered.includes("food service")) return "restaurant";
  if (lowered.includes("office") || lowered.includes("corporate")) return "office";
  if (lowered.includes("propert") || lowered.includes("apartment") || lowered.includes("hoa")) {
    return "property";
  }
  if (lowered.includes("facilit") || lowered.includes("building")) return "facility";
  return "other";
}

export function assignTargetId(raw: RawTarget): string {
  if (raw.id && raw.id.trim()) return raw.id.trim();
  const basis = [
    raw.name ?? "",
    raw.address?.street ?? "",
    raw.address?.city ?? "",
    raw.address?.state ?? "",
    raw.public_contact?.website ?? ""
  ]
    .join("|")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  return createHash("sha256").update(basis || "unnamed").digest("hex").slice(0, 12);
}

export function normalizeTarget(raw: RawTarget, ingestedAt = new Date().toISOString()): Target {
  const example = looksLikeExample(raw);
  const source: TargetSource = example ? "example" : "agent_ingest";
  const name = (raw.name ?? "").trim() || "Unnamed target";
  const source_note = raw.source_note?.trim()
    ? raw.source_note.trim()
    : example
      ? EXAMPLE_SOURCE_NOTE
      : AGENT_INGEST_SOURCE_NOTE;

  return {
    id: assignTargetId({ ...raw, name }),
    source,
    source_note,
    example,
    name,
    site_type: normalizeSiteType(raw.site_type),
    address: raw.address ? { ...raw.address } : undefined,
    decision_maker: raw.decision_maker ? { ...raw.decision_maker } : undefined,
    public_contact: raw.public_contact ? { ...raw.public_contact } : undefined,
    notes: raw.notes,
    ingested_at: ingestedAt
  };
}

export function normalizeTargets(records: RawTarget[], ingestedAt?: string): Target[] {
  return records.map((record) => normalizeTarget(record, ingestedAt));
}

export function compactTarget(target: Target) {
  return {
    id: target.id,
    name: target.name,
    example: target.example,
    source: target.source,
    site_type: target.site_type ?? null,
    city: target.address?.city ?? null,
    state: target.address?.state ?? null,
    decision_maker_title: target.decision_maker?.title ?? null
  };
}
