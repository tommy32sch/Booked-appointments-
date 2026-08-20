import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const mcpEntry = fileURLToPath(new URL("../src/mcp.ts", import.meta.url));
const tsxCli = fileURLToPath(new URL("../node_modules/tsx/dist/cli.mjs", import.meta.url));

const EXPECTED_TOOLS = [
  "playbook",
  "find_targets",
  "list_targets",
  "score_target",
  "draft_outreach",
  "calendar_booking"
];

test("MCP stdio server lists v1 tools and serves playbook JSON", async (t) => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [tsxCli, mcpEntry]
  });
  const client = new Client({ name: "booked-appointments-test", version: "0.1.0" });
  await client.connect(transport);
  t.after(async () => {
    await client.close();
  });

  const listed = await client.listTools();
  const names = listed.tools.map((tool) => tool.name).sort();
  assert.deepEqual(names, [...EXPECTED_TOOLS].sort());

  const playbook = await client.callTool({ name: "playbook", arguments: { vertical: "janitorial" } });
  const text = (playbook.content as { type: string; text?: string }[])
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("\n");
  const parsed = JSON.parse(text) as { ok: boolean; data: { id: string; done: { v1: string } } };
  assert.equal(parsed.ok, true);
  assert.equal(parsed.data.id, "janitorial_us_v1");
  assert.match(parsed.data.done.v1, /stub/);

  const calendar = await client.callTool({ name: "calendar_booking", arguments: {} });
  const calText = (calendar.content as { type: string; text?: string }[])
    .map((part) => part.text ?? "")
    .join("\n");
  const cal = JSON.parse(calText) as { ok: boolean; data: { status: string; next_hook: { hook_id: string } } };
  assert.equal(cal.ok, true);
  assert.equal(cal.data.status, "stub");
  assert.equal(cal.data.next_hook.hook_id, "create_exclusive_walkthrough_event");
});

test("MCP process starts and does not print protocol noise on stdout before a client", async () => {
  const child = spawn(process.execPath, [tsxCli, mcpEntry], {
    stdio: ["pipe", "pipe", "pipe"]
  });
  let stdout = "";
  child.stdout.on("data", (chunk: Buffer) => {
    stdout += chunk.toString("utf8");
  });
  await new Promise((resolve) => setTimeout(resolve, 400));
  child.kill("SIGTERM");
  await new Promise<void>((resolve) => child.once("close", () => resolve()));
  assert.equal(stdout.trim(), "", "stdio MCP must keep stdout reserved for JSON-RPC");
});
