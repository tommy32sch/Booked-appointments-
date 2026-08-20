import { calendarBookingStub } from "./calendar.js";
import { draftOutreach } from "./outreach.js";
import { publicSearchQueries, resolvePlaybook } from "./playbook.js";
import { err, ok, type Result } from "./result.js";
import {
  calendarBookingInputSchema,
  draftOutreachInputSchema,
  findTargetsInputSchema,
  listTargetsInputSchema,
  playbookInputSchema,
  scoreTargetInputSchema,
  sendOutreachInputSchema,
  type CalendarBookingInput,
  type DraftOutreachInput,
  type FindTargetsInput,
  type ListTargetsInput,
  type PlaybookInput,
  type ScoreTargetInput
} from "./schemas.js";
import {
  assertSendableChannel,
  recipientEmail,
  rejectBulkSend,
  requireExplicitApproval,
  resolveSendTransport,
  SEND_DONE_DEFINITION,
  type SendOutreachOptions
} from "./send.js";
import { scoreTarget } from "./score.js";
import { getStore } from "./store.js";
import { compactTarget, normalizeTarget, normalizeTargets } from "./targets.js";
import type { RawTarget, Target } from "./types.js";
import { DEFAULT_VERTICAL } from "./types.js";

async function resolveTarget(input: {
  id?: string;
  target?: RawTarget;
  store_path?: string;
}): Promise<Result<Target>> {
  if (input.target) {
    return ok(normalizeTarget(input.target));
  }
  if (!input.id) {
    return err("INVALID_INPUT", "Provide target.id from the store or an inline target object.");
  }
  const store = getStore(input.store_path);
  const loaded = await store.ensureLoaded();
  if (!loaded.ok) return loaded;
  const found = store.getSync(input.id);
  if (!found) {
    return err("TARGET_NOT_FOUND", `No target with id '${input.id}'. Ingest records via find_targets or pass target inline.`);
  }
  return ok(found);
}

export async function runPlaybook(input: PlaybookInput = {}): Promise<Result<unknown>> {
  const parsed = playbookInputSchema.safeParse(input);
  if (!parsed.success) {
    return err("INVALID_INPUT", "Invalid playbook input.", parsed.error.flatten());
  }
  const playbook = resolvePlaybook(parsed.data.vertical ?? DEFAULT_VERTICAL);
  if (!playbook) {
    return err(
      "UNSUPPORTED_VERTICAL",
      `V1 ships only the 'janitorial' playbook. Received '${parsed.data.vertical}'.`
    );
  }
  return ok(playbook);
}

export async function runFindTargets(input: FindTargetsInput = {}): Promise<Result<unknown>> {
  const parsed = findTargetsInputSchema.safeParse(input);
  if (!parsed.success) {
    return err("INVALID_INPUT", "Invalid find_targets input.", parsed.error.flatten());
  }
  const { records = [], geo, persist = true, store_path } = parsed.data;
  const ingestedAt = new Date().toISOString();
  const targets = normalizeTargets(records, ingestedAt);

  let persisted = false;
  if (persist && targets.length > 0) {
    const store = getStore(store_path);
    const loaded = await store.ensureLoaded();
    if (!loaded.ok) return loaded;
    store.upsertSync(targets);
    const saved = await store.persist();
    if (!saved.ok) return saved;
    persisted = true;
  }

  return ok({
    vertical: DEFAULT_VERTICAL,
    mode: "normalize_and_query_pack",
    api_calls: [],
    note: "This tool does not call Google Maps, LinkedIn, or other live search APIs. Pass structured public records you already have, and/or run the returned queries yourself on public sources.",
    icp_filters: {
      geography: "US",
      site_types: ["office", "warehouse", "restaurant", "facility", "property"],
      decision_maker_titles: [
        "Facilities Manager",
        "Property Manager",
        "Operations Manager",
        "Office Manager",
        "General Manager",
        "Owner"
      ],
      exclude: ["residential house cleaning", "patient/PHI lists", "non-US"]
    },
    public_search: publicSearchQueries(geo ?? "{geo}"),
    ingested: {
      count: targets.length,
      persisted,
      store_path: persist ? store_path ?? null : null,
      targets,
      example_count: targets.filter((t) => t.example).length
    }
  });
}

export async function runListTargets(input: ListTargetsInput = {}): Promise<Result<unknown>> {
  const parsed = listTargetsInputSchema.safeParse(input);
  if (!parsed.success) {
    return err("INVALID_INPUT", "Invalid list_targets input.", parsed.error.flatten());
  }
  const includeExamples = parsed.data.include_examples ?? true;
  const store = getStore(parsed.data.store_path);
  const loaded = await store.ensureLoaded();
  if (!loaded.ok) return loaded;
  const targets = store.listSync().filter((target) => includeExamples || !target.example);
  return ok({
    store_path: parsed.data.store_path ?? null,
    count: targets.length,
    targets,
    compact: targets.map(compactTarget)
  });
}

export async function runScoreTarget(input: ScoreTargetInput = {}): Promise<Result<unknown>> {
  const parsed = scoreTargetInputSchema.safeParse(input);
  if (!parsed.success) {
    return err("INVALID_INPUT", "Invalid score_target input.", parsed.error.flatten());
  }
  const target = await resolveTarget(parsed.data);
  if (!target.ok) return target;
  return ok({
    target: target.data,
    score: scoreTarget(target.data)
  });
}

export async function runDraftOutreach(input: DraftOutreachInput = {}): Promise<Result<unknown>> {
  const parsed = draftOutreachInputSchema.safeParse(input);
  if (!parsed.success) {
    return err("INVALID_INPUT", "Invalid draft_outreach input.", parsed.error.flatten());
  }
  const target = await resolveTarget(parsed.data);
  if (!target.ok) return target;
  return ok({
    target: compactTarget(target.data),
    draft: draftOutreach(target.data, parsed.data.channel ?? "email", parsed.data.buyer_name)
  });
}

export async function runSendOutreach(
  input: unknown = {},
  options: SendOutreachOptions = {}
): Promise<Result<unknown>> {
  const bulk = rejectBulkSend(input);
  if (!bulk.ok) return bulk;

  const approval = requireExplicitApproval(input);
  if (!approval.ok) return approval;

  const parsed = sendOutreachInputSchema.safeParse(input);
  if (!parsed.success) {
    return err("INVALID_INPUT", "Invalid send_outreach input.", parsed.error.flatten());
  }

  const channel = parsed.data.channel ?? "email";
  const sendable = assertSendableChannel(channel);
  if (!sendable.ok) return sendable;

  const target = await resolveTarget(parsed.data);
  if (!target.ok) return target;

  const to = recipientEmail(target.data.public_contact?.email);
  if (!to.ok) return to;

  const resolved = resolveSendTransport(options);
  if (!resolved.ok) return resolved;

  const draft = draftOutreach(target.data, channel, parsed.data.buyer_name);
  const subject = parsed.data.subject?.trim() || draft.subject;
  const body = parsed.data.body?.trim() || draft.body;
  if (!subject) {
    return err("INVALID_INPUT", "Approved email is missing a subject. Pass subject or use the generated draft.");
  }

  let receipt;
  try {
    receipt = await resolved.data.transport.send({
      from: resolved.data.config.from,
      to: to.data,
      subject,
      text: body
    });
  } catch (error) {
    return err(
      "SEND_FAILED",
      "SMTP transport rejected the send. send_status is not sent.",
      error instanceof Error ? error.message : String(error)
    );
  }

  if (!receipt.accepted) {
    return err("SEND_FAILED", "SMTP transport did not accept the message. send_status is not sent.");
  }

  return ok({
    send_status: "sent",
    approved: true,
    channel: "email" as const,
    purpose: "book_exclusive_walkthrough",
    shared_lead: false,
    target: compactTarget(target.data),
    to: to.data,
    from: resolved.data.config.from,
    subject,
    body,
    compliance: draft.compliance,
    transport: {
      kind: "smtp" as const,
      host: resolved.data.config.host,
      port: resolved.data.config.port,
      accepted: true as const,
      message_id: receipt.messageId ?? null
    },
    note: draft.note,
    done: SEND_DONE_DEFINITION
  });
}

export async function runCalendarBooking(input: CalendarBookingInput = {}): Promise<Result<unknown>> {
  const parsed = calendarBookingInputSchema.safeParse(input);
  if (!parsed.success) {
    return err("INVALID_INPUT", "Invalid calendar_booking input.", parsed.error.flatten());
  }
  let target: Target | undefined;
  if (parsed.data.id || parsed.data.target) {
    const resolved = await resolveTarget(parsed.data);
    if (!resolved.ok) return resolved;
    target = resolved.data;
  }
  return ok(calendarBookingStub({ target, proposed_slots: parsed.data.proposed_slots }));
}

export const toolHandlers = {
  playbook: runPlaybook,
  find_targets: runFindTargets,
  list_targets: runListTargets,
  score_target: runScoreTarget,
  draft_outreach: runDraftOutreach,
  send_outreach: runSendOutreach,
  calendar_booking: runCalendarBooking
} as const;
