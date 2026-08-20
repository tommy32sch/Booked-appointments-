#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { DEFAULT_STORE_PATH, TOOL_NAMES } from "./types.js";
import { PACKAGE_NAME, PACKAGE_VERSION } from "./version.js";
import {
  runCalendarBooking,
  runDraftOutreach,
  runFindTargets,
  runListTargets,
  runPlaybook,
  runScoreTarget
} from "./tools.js";
import type { Result } from "./result.js";
import type { OutreachChannel, RawTarget } from "./types.js";

type Flags = Record<string, string | boolean>;

export function parseArgs(argv: string[]): { command: string; flags: Flags } {
  const args = argv.slice(2);
  let command = "help";
  const flags: Flags = {};
  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = args[i + 1];
      if (next !== undefined && !next.startsWith("-")) {
        flags[key] = next;
        i += 1;
      } else {
        flags[key] = true;
      }
    } else if (command === "help") {
      command = token;
    }
  }
  return { command, flags };
}

function flagString(flags: Flags, name: string): string | undefined {
  const value = flags[name];
  return typeof value === "string" ? value : undefined;
}

function flagBool(flags: Flags, name: string, fallback?: boolean): boolean | undefined {
  const value = flags[name];
  if (value === undefined) return fallback;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return fallback;
}

async function loadRecords(inputPath?: string): Promise<RawTarget[]> {
  if (!inputPath) return [];
  const raw = await readFile(inputPath, "utf8");
  const parsed = JSON.parse(raw) as { records?: RawTarget[] } | RawTarget[];
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.records)) return parsed.records;
  throw new Error(`Input file ${inputPath} must be an array or { "records": [...] }.`);
}

async function loadTarget(inputPath?: string): Promise<RawTarget | undefined> {
  if (!inputPath) return undefined;
  const records = await loadRecords(inputPath);
  if (records.length === 1) return records[0];
  const raw = JSON.parse(await readFile(inputPath, "utf8")) as RawTarget;
  if (raw && typeof raw === "object" && !Array.isArray(raw) && !("records" in raw)) return raw;
  throw new Error(`--input for this command must be a single target object (or records array of length 1).`);
}

function storePath(flags: Flags): string {
  return flagString(flags, "store") ?? DEFAULT_STORE_PATH;
}

export const HELP = `${PACKAGE_NAME} ${PACKAGE_VERSION}

Agent CLI. Maps 1:1 to MCP tools. JSON on stdout.

Usage:
  booked-appointments <command> [flags]

Commands (MCP tool):
  playbook            playbook
  find-targets        find_targets
  list-targets        list_targets
  score-target        score_target
  draft-outreach      draft_outreach
  calendar-booking    calendar_booking
  tools               list the 1:1 tool map
  version             package version
  help                this text

Flags:
  --vertical janitorial
  --input <path>          fixture / structured records JSON
  --geo "Austin, TX"      fills public search query templates
  --id <target-id>
  --channel email|phone|linkedin
  --buyer-name <name>     janitorial buyer display name
  --store <path>          default ${DEFAULT_STORE_PATH}
  --persist true|false    find-targets only (default true)
  --include-examples true|false
  --proposed-slots <iso,iso>

Done (v1): exclusive walkthrough booked on a calendar — calendar_booking is a stub.
Docs: docs/agent.md
`;

export async function runCli(argv: string[]): Promise<Result<unknown>> {
  const { command, flags } = parseArgs(argv);

  switch (command) {
    case "help":
    case "--help":
    case "-h":
      return { ok: true, data: { help: HELP } };
    case "version":
    case "--version":
    case "-v":
      return { ok: true, data: { name: PACKAGE_NAME, version: PACKAGE_VERSION } };
    case "tools":
      return {
        ok: true,
        data: {
          tools: TOOL_NAMES,
          cli: {
            playbook: "playbook",
            "find-targets": "find_targets",
            "list-targets": "list_targets",
            "score-target": "score_target",
            "draft-outreach": "draft_outreach",
            "calendar-booking": "calendar_booking"
          }
        }
      };
    case "playbook":
      return runPlaybook({ vertical: flagString(flags, "vertical") });
    case "find-targets":
      return runFindTargets({
        records: await loadRecords(flagString(flags, "input")),
        geo: flagString(flags, "geo"),
        persist: flagBool(flags, "persist", true),
        store_path: storePath(flags)
      });
    case "list-targets":
      return runListTargets({
        store_path: storePath(flags),
        include_examples: flagBool(flags, "include-examples", true)
      });
    case "score-target":
      return runScoreTarget({
        id: flagString(flags, "id"),
        target: await loadTarget(flagString(flags, "input")),
        store_path: storePath(flags)
      });
    case "draft-outreach":
      return runDraftOutreach({
        id: flagString(flags, "id"),
        target: await loadTarget(flagString(flags, "input")),
        channel: flagString(flags, "channel") as OutreachChannel | undefined,
        buyer_name: flagString(flags, "buyer-name"),
        store_path: storePath(flags)
      });
    case "calendar-booking":
      return runCalendarBooking({
        id: flagString(flags, "id"),
        target: await loadTarget(flagString(flags, "input")),
        store_path: storePath(flags),
        proposed_slots: flagString(flags, "proposed-slots")?.split(",").map((s) => s.trim()).filter(Boolean)
      });
    default:
      return {
        ok: false,
        error: {
          code: "UNKNOWN_TOOL",
          message: `Unknown command '${command}'. See booked-appointments help.`
        }
      };
  }
}

export async function main(argv = process.argv): Promise<number> {
  try {
    const result = await runCli(argv);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return result.ok ? 0 : 1;
  } catch (error) {
    const result = {
      ok: false as const,
      error: {
        code: "INVALID_INPUT" as const,
        message: error instanceof Error ? error.message : String(error)
      }
    };
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return 1;
  }
}

function isMain(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(entry).href;
}

if (isMain()) {
  main().then((code) => process.exit(code));
}
