import nodemailer from "nodemailer";
import { err, ok, type Result } from "./result.js";
import type { OutreachChannel } from "./types.js";

export const SMTP_ENV_NAMES = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
  "SMTP_SECURE"
] as const;

export const SMTP_CREDENTIAL_ENV = ["SMTP_USER", "SMTP_PASS"] as const;

export const DEFAULT_SMTP_HOST = "smtp.gmail.com";

export const SEND_DONE_DEFINITION =
  "This one approved email was handed to a real SMTP transport — or a typed config error (SEND_NOT_CONFIGURED). Never send_status=sent unless a real transport accepted the message.";

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

export type MailEnvelope = {
  from: string;
  to: string;
  subject: string;
  text: string;
};

export type MailSendReceipt = {
  accepted: boolean;
  messageId?: string;
  response?: string;
};

export type MailTransport = {
  send(message: MailEnvelope): Promise<MailSendReceipt>;
};

export type SendOutreachOptions = {
  env?: NodeJS.Dict<string>;
  transport?: MailTransport;
};

const BULK_KEYS = [
  "ids",
  "targets",
  "channels",
  "drafts",
  "records",
  "recipients",
  "to",
  "all",
  "send_all",
  "send-all"
] as const;

const SINGLE_OR_ARRAY_KEYS = ["id", "target", "channel", "draft"] as const;

function isAllOrGlob(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "all" || trimmed === "*") return true;
  return /[*?[\]]/.test(value);
}

function looksLikeBulkList(value: string): boolean {
  return value.includes(",") || value.split(/\s+/).filter(Boolean).length > 1;
}

/**
 * One target + one channel + one draft per call. No send-all, arrays, globs, or `all`.
 */
export function rejectBulkSend(input: unknown): Result<void> {
  if (input == null) return ok(undefined);
  if (Array.isArray(input)) {
    return err(
      "SEND_ALL_REJECTED",
      "send_outreach is one target + one channel + one draft per call. Arrays are rejected. There is no send-all."
    );
  }
  if (typeof input !== "object") return ok(undefined);

  const rec = input as Record<string, unknown>;

  for (const key of BULK_KEYS) {
    if (rec[key] !== undefined) {
      return err(
        "SEND_ALL_REJECTED",
        `send_outreach rejected '${key}'. One target + one channel + one draft per call. Arrays, glob, and all are not allowed.`
      );
    }
  }

  for (const key of SINGLE_OR_ARRAY_KEYS) {
    const value = rec[key];
    if (Array.isArray(value)) {
      return err(
        "SEND_ALL_REJECTED",
        `send_outreach rejected array '${key}'. One target + one channel + one draft per call. There is no send-all.`
      );
    }
    if (typeof value === "string" && (isAllOrGlob(value) || looksLikeBulkList(value))) {
      return err(
        "SEND_ALL_REJECTED",
        `send_outreach rejected '${key}=${value}'. One target + one channel + one draft per call. Arrays, glob, and all are not allowed.`
      );
    }
  }

  return ok(undefined);
}

/**
 * Captain/human review gate. Only boolean true on this one message is approval.
 */
export function requireExplicitApproval(input: unknown): Result<void> {
  const approved =
    input && typeof input === "object" && !Array.isArray(input)
      ? (input as Record<string, unknown>).approved
      : undefined;
  if (approved !== true) {
    return err(
      "NOT_APPROVED",
      "send_outreach refuses unless approved is boolean true on this one message after human/captain review. Missing, false, or any other value is not approval. There is no default send."
    );
  }
  return ok(undefined);
}

export function missingSmtpCredentialEnv(env: NodeJS.Dict<string> = process.env): string[] {
  return SMTP_CREDENTIAL_ENV.filter((name) => !env[name]?.trim());
}

export function readSmtpConfig(env: NodeJS.Dict<string> = process.env): Result<SmtpConfig> {
  const missing = missingSmtpCredentialEnv(env);
  if (missing.length > 0) {
    return err(
      "SEND_NOT_CONFIGURED",
      [
        "Mail is not configured. A real Gmail/SMTP credential is required.",
        `Missing: ${missing.join(", ")}.`,
        "Set SMTP_USER and SMTP_PASS (Gmail app password or SMTP password).",
        `Documented env: ${SMTP_ENV_NAMES.join(", ")}.`,
        `SMTP_HOST defaults to ${DEFAULT_SMTP_HOST} when credentials are present.`,
        "This tool will not fake a send."
      ].join(" "),
      {
        missing_env: missing,
        required_credential_env: [...SMTP_CREDENTIAL_ENV],
        documented_env: [...SMTP_ENV_NAMES],
        default_host: DEFAULT_SMTP_HOST
      }
    );
  }

  const user = env.SMTP_USER!.trim();
  const pass = env.SMTP_PASS!.trim();
  const host = env.SMTP_HOST?.trim() || DEFAULT_SMTP_HOST;
  const from = env.SMTP_FROM?.trim() || user;
  const secureRaw = env.SMTP_SECURE?.trim().toLowerCase();
  const secure = secureRaw === "true" || secureRaw === "1";

  let port: number;
  if (env.SMTP_PORT?.trim()) {
    port = Number(env.SMTP_PORT);
    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
      return err("INVALID_INPUT", `SMTP_PORT must be an integer 1–65535. Received '${env.SMTP_PORT}'.`);
    }
  } else {
    port = secure ? 465 : 587;
  }

  return ok({ host, port, secure, user, pass, from });
}

export function createNodemailerTransport(config: SmtpConfig): MailTransport {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    }
  });

  return {
    async send(message: MailEnvelope): Promise<MailSendReceipt> {
      const info = await transporter.sendMail({
        from: message.from,
        to: message.to,
        subject: message.subject,
        text: message.text
      });
      const accepted = Array.isArray(info.accepted) && info.accepted.length > 0;
      return {
        accepted,
        messageId: typeof info.messageId === "string" ? info.messageId : undefined,
        response: typeof info.response === "string" ? info.response : undefined
      };
    }
  };
}

export function resolveSendTransport(options: SendOutreachOptions = {}): Result<{
  config: SmtpConfig;
  transport: MailTransport;
}> {
  const env = options.env ?? process.env;
  const config = readSmtpConfig(env);
  if (!config.ok) return config;
  const transport = options.transport ?? createNodemailerTransport(config.data);
  return ok({ config: config.data, transport });
}

export function assertSendableChannel(channel: OutreachChannel): Result<void> {
  if (channel !== "email") {
    return err(
      "CHANNEL_NOT_SENDABLE",
      `Channel '${channel}' is not sendable in v1. Email is the only live send path. Phone and LinkedIn drafts stay draft-only — this tool will not fake a send.`
    );
  }
  return ok(undefined);
}

export function recipientEmail(email?: string): Result<string> {
  const value = email?.trim();
  if (!value) {
    return err(
      "MISSING_RECIPIENT",
      "Target has no public_contact.email. send_outreach will not invent an address or fake a send."
    );
  }
  return ok(value);
}
