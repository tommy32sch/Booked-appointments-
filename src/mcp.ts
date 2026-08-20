#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { MCP_SERVER_NAME, PACKAGE_VERSION } from "./version.js";
import {
  runCalendarBooking,
  runDraftOutreach,
  runFindTargets,
  runListTargets,
  runPlaybook,
  runScoreTarget,
  runSendOutreach
} from "./tools.js";
import type { Result } from "./result.js";

function asToolResult(result: Result<unknown>) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    structuredContent: result as unknown as Record<string, unknown>,
    isError: !result.ok
  };
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: MCP_SERVER_NAME,
    version: PACKAGE_VERSION
  });

  server.registerTool(
    "playbook",
    {
      title: "Janitorial playbook",
      description:
        "Return the v1 US commercial janitorial playbook: ICP, exclusive-walkthrough offer, sourced market context, compliance, job loop, and done definition. Only vertical is janitorial.",
      inputSchema: {
        vertical: z
          .string()
          .optional()
          .describe("Playbook vertical. V1 accepts only 'janitorial'.")
      }
    },
    async (args) => asToolResult(await runPlaybook(args))
  );

  server.registerTool(
    "find_targets",
    {
      title: "Find / normalize targets",
      description:
        "Does not call Google Maps or LinkedIn APIs. Accept structured public records the calling agent already has, normalize them, optionally persist, and return playbook search queries + ICP filters the agent can run on public sources.",
      inputSchema: {
        records: z
          .array(z.record(z.unknown()))
          .optional()
          .describe(
            "Structured public records you already collected. Mark examples with example=true. Never pass fabricated customers as real."
          ),
        geo: z.string().optional().describe("US city/region to fill into public search query templates, e.g. 'Austin, TX'."),
        persist: z
          .boolean()
          .optional()
          .describe("If true (default) and records are provided, upsert into the job store."),
        store_path: z.string().optional().describe("Optional JSON store path. Defaults to in-memory for this MCP process.")
      }
    },
    async (args) => asToolResult(await runFindTargets(args as never))
  );

  server.registerTool(
    "list_targets",
    {
      title: "List targets",
      description: "List normalized targets from the job store (in-memory for this MCP process unless store_path is set).",
      inputSchema: {
        store_path: z.string().optional().describe("Optional JSON store path."),
        include_examples: z
          .boolean()
          .optional()
          .describe("Include example/fixture records. Default true.")
      }
    },
    async (args) => asToolResult(await runListTargets(args))
  );

  server.registerTool(
    "score_target",
    {
      title: "Score / qualify a target",
      description:
        "Rule-based ICP qualification for a commercial janitorial walkthrough. No invented conversion rates. Pass id (from store) or an inline target.",
      inputSchema: {
        id: z.string().optional().describe("Stored target id from find_targets / list_targets."),
        target: z.record(z.unknown()).optional().describe("Inline structured public record to score without the store."),
        store_path: z.string().optional()
      }
    },
    async (args) => asToolResult(await runScoreTarget(args as never))
  );

  server.registerTool(
    "draft_outreach",
    {
      title: "Draft exclusive-walkthrough outreach",
      description:
        "Draft email, phone, or LinkedIn outreach whose only ask is an exclusive calendar-booked walkthrough. Draft only — does not send. After captain/human review of that one message, use send_outreach with approved=true. TCPA/CAN-SPAM stay on the payload.",
      inputSchema: {
        id: z.string().optional(),
        target: z.record(z.unknown()).optional(),
        channel: z.enum(["email", "phone", "linkedin"]).optional().describe("Default email."),
        buyer_name: z.string().optional().describe("Janitorial buyer display name. Do not invent a real company."),
        store_path: z.string().optional()
      }
    },
    async (args) => asToolResult(await runDraftOutreach(args as never))
  );

  server.registerTool(
    "send_outreach",
    {
      title: "Send one reviewed outreach email",
      description:
        "Send one already-reviewed outreach message. Requires approved=true (boolean) on THAT one message. No send-all, no default send, no arrays/glob/all. Email is the only v1 send path (SMTP). Phone/LinkedIn return CHANNEL_NOT_SENDABLE. If SMTP_USER/SMTP_PASS are missing, returns SEND_NOT_CONFIGURED and does not fake a send. send_status=sent only after a real SMTP transport accepts the message.",
      inputSchema: {
        id: z.string().optional().describe("One stored target id. Not an array, not 'all', not a glob."),
        target: z.record(z.unknown()).optional().describe("One inline structured public record. Not an array."),
        channel: z
          .enum(["email", "phone", "linkedin"])
          .optional()
          .describe("One channel. Default email. Only email is sendable in v1."),
        buyer_name: z.string().optional().describe("Janitorial buyer display name. Do not invent a real company."),
        store_path: z.string().optional(),
        approved: z
          .unknown()
          .optional()
          .describe(
            "Must be boolean true for this one message after human/captain review. Missing, false, or any other value is NOT_APPROVED. No default send."
          ),
        subject: z.string().optional().describe("Optional approved subject. Defaults to the generated draft for this target+channel."),
        body: z.string().optional().describe("Optional approved body. Defaults to the generated draft for this target+channel.")
      }
    },
    async (args) => asToolResult(await runSendOutreach(args))
  );

  server.registerTool(
    "calendar_booking",
    {
      title: "Calendar booking (stub)",
      description:
        "CLEAN STUB. Does not call Google Calendar and does not perform OAuth. Returns a structured next hook for create_exclusive_walkthrough_event.",
      inputSchema: {
        id: z.string().optional(),
        target: z.record(z.unknown()).optional(),
        store_path: z.string().optional(),
        proposed_slots: z.array(z.string()).optional().describe("Optional ISO-8601 windows the agent collected. Stored on the stub only.")
      }
    },
    async (args) => asToolResult(await runCalendarBooking(args as never))
  );

  return server;
}

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

function isMain(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(entry).href;
}

if (isMain()) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
