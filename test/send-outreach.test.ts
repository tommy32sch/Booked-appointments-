import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { runCli } from "../src/cli.js";
import type { MailEnvelope, MailTransport } from "../src/send.js";
import { readSmtpConfig } from "../src/send.js";
import { resetStoreCache } from "../src/store.js";
import { runDraftOutreach, runSendOutreach } from "../src/tools.js";
import type { RawTarget } from "../src/types.js";

const office: RawTarget = {
  example: true,
  name: "Example Office Park LLC",
  site_type: "office",
  address: { city: "Austin", state: "TX", country: "US" },
  decision_maker: { name: "Alex Rivera", title: "Facilities Manager" },
  public_contact: { email: "facilities@example-office-park.example" }
};

const TEST_SMTP_ENV = {
  SMTP_HOST: "smtp.example.test",
  SMTP_PORT: "587",
  SMTP_USER: "buyer@example.test",
  SMTP_PASS: "not-a-real-password",
  SMTP_FROM: "buyer@example.test"
};

function trackingTransport(): { transport: MailTransport; sent: MailEnvelope[]; calls: number } {
  const sent: MailEnvelope[] = [];
  let calls = 0;
  const transport: MailTransport = {
    async send(message) {
      calls += 1;
      sent.push(message);
      return { accepted: true, messageId: "mock-message-id" };
    }
  };
  return {
    transport,
    sent,
    get calls() {
      return calls;
    }
  };
}

test("send_outreach refuses without approved=true", async () => {
  const tracker = trackingTransport();
  const cases: unknown[] = [
    { target: office, channel: "email" },
    { target: office, channel: "email", approved: false },
    { target: office, channel: "email", approved: "true" },
    { target: office, channel: "email", approved: 1 },
    { target: office, channel: "email", approved: "yes" }
  ];

  for (const input of cases) {
    const result = await runSendOutreach(input, { env: TEST_SMTP_ENV, transport: tracker.transport });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "NOT_APPROVED");
    }
  }
  assert.equal(tracker.calls, 0);
});

test("send_outreach refuses send-all, arrays, glob, and all", async () => {
  const tracker = trackingTransport();
  const cases: unknown[] = [
    { ids: ["a", "b"], approved: true },
    { id: ["a", "b"], approved: true },
    { id: "all", approved: true },
    { id: "*", approved: true },
    { id: "example-*", approved: true },
    { targets: [office], approved: true },
    { target: [office], approved: true },
    { target: office, channel: ["email", "phone"], approved: true },
    { target: office, channel: "all", approved: true },
    { target: office, drafts: [{ body: "x" }], approved: true },
    { all: true, approved: true },
    { send_all: true, approved: true }
  ];

  for (const input of cases) {
    const result = await runSendOutreach(input, { env: TEST_SMTP_ENV, transport: tracker.transport });
    assert.equal(result.ok, false, JSON.stringify(input));
    if (!result.ok) {
      assert.equal(result.error.code, "SEND_ALL_REJECTED");
    }
  }
  assert.equal(tracker.calls, 0);
});

test("send_outreach refuses when SMTP env is absent and does not fake sent", async () => {
  const tracker = trackingTransport();
  const result = await runSendOutreach(
    { target: office, channel: "email", approved: true },
    { env: {}, transport: tracker.transport }
  );
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.code, "SEND_NOT_CONFIGURED");
    assert.match(result.error.message, /SMTP_USER/);
    assert.match(result.error.message, /SMTP_PASS/);
    assert.match(result.error.message, /real Gmail\/SMTP credential/i);
    assert.match(result.error.message, /will not fake a send/i);
  }
  assert.equal(tracker.calls, 0);
  assert.equal(JSON.stringify(result).includes('"send_status": "sent"'), false);
});

test("readSmtpConfig names missing credential env and does not invent a send", () => {
  const result = readSmtpConfig({});
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.code, "SEND_NOT_CONFIGURED");
    const details = result.error.details as { missing_env: string[] };
    assert.deepEqual(details.missing_env, ["SMTP_USER", "SMTP_PASS"]);
  }
});

test("send_outreach happy path uses mock transport only — never a live inbox", async () => {
  const tracker = trackingTransport();
  const result = await runSendOutreach(
    { target: office, channel: "email", approved: true, buyer_name: "Example Janitorial Buyer" },
    { env: TEST_SMTP_ENV, transport: tracker.transport }
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const data = result.data as {
    send_status: string;
    approved: boolean;
    channel: string;
    to: string;
    from: string;
    subject: string;
    body: string;
    compliance: string[];
    transport: { kind: string; host: string; accepted: boolean; message_id: string };
    done: string;
  };
  assert.equal(data.send_status, "sent");
  assert.equal(data.approved, true);
  assert.equal(data.channel, "email");
  assert.equal(data.to, "facilities@example-office-park.example");
  assert.equal(data.from, "buyer@example.test");
  assert.equal(data.transport.kind, "smtp");
  assert.equal(data.transport.host, "smtp.example.test");
  assert.equal(data.transport.accepted, true);
  assert.equal(data.transport.message_id, "mock-message-id");
  assert.match(data.body, /exclusive walkthrough/i);
  assert.ok(data.compliance.some((c) => /CAN-SPAM/i.test(c)));
  assert.ok(data.compliance.some((c) => /TCPA/i.test(c)));
  assert.match(data.done, /real SMTP transport/);
  assert.equal(tracker.calls, 1);
  assert.equal(tracker.sent[0]?.to, "facilities@example-office-park.example");
  assert.equal(tracker.sent[0]?.from, "buyer@example.test");
});

test("send_outreach phone and linkedin are not sendable", async () => {
  const tracker = trackingTransport();
  for (const channel of ["phone", "linkedin"] as const) {
    const result = await runSendOutreach(
      { target: office, channel, approved: true },
      { env: TEST_SMTP_ENV, transport: tracker.transport }
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "CHANNEL_NOT_SENDABLE");
      assert.match(result.error.message, /email is the only/i);
    }
  }
  assert.equal(tracker.calls, 0);
});

test("draft_outreach stays draft-only even when SMTP env is present", async () => {
  const draft = await runDraftOutreach({ target: office, channel: "email" });
  assert.equal(draft.ok, true);
  if (!draft.ok) return;
  const payload = draft.data as { draft: { send_status: string } };
  assert.equal(payload.draft.send_status, "draft_only");
});

test("send_outreach does not claim sent when mock transport does not accept", async () => {
  const transport: MailTransport = {
    async send() {
      return { accepted: false };
    }
  };
  const result = await runSendOutreach(
    { target: office, channel: "email", approved: true },
    { env: TEST_SMTP_ENV, transport }
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "SEND_FAILED");
  assert.equal(JSON.stringify(result).includes('"send_status": "sent"'), false);
});

test("CLI send-outreach maps 1:1 and enforces the review gate", async () => {
  resetStoreCache();
  const store = path.join(await mkdtemp(path.join(tmpdir(), "ba-send-")), "store.json");
  const fixturePath = fileURLToPath(new URL("../fixtures/example-targets.json", import.meta.url));

  const find = await runCli([
    "node",
    "cli",
    "find-targets",
    "--input",
    fixturePath,
    "--geo",
    "Austin, TX",
    "--store",
    store
  ]);
  assert.equal(find.ok, true);
  if (!find.ok) return;
  const officeTarget = (find.data as { ingested: { targets: { id: string; name: string }[] } }).ingested.targets.find(
    (t) => t.name === "Example Office Park LLC"
  );
  assert.ok(officeTarget);

  const refused = await runCli([
    "node",
    "cli",
    "send-outreach",
    "--id",
    officeTarget.id,
    "--channel",
    "email",
    "--store",
    store
  ]);
  assert.equal(refused.ok, false);
  if (!refused.ok) assert.equal(refused.error.code, "NOT_APPROVED");

  const sendAll = await runCli([
    "node",
    "cli",
    "send-outreach",
    "--id",
    "all",
    "--approved",
    "true",
    "--store",
    store
  ]);
  assert.equal(sendAll.ok, false);
  if (!sendAll.ok) assert.equal(sendAll.error.code, "SEND_ALL_REJECTED");

  const idsFlag = await runCli([
    "node",
    "cli",
    "send-outreach",
    "--ids",
    "a,b",
    "--approved",
    "true",
    "--store",
    store
  ]);
  assert.equal(idsFlag.ok, false);
  if (!idsFlag.ok) assert.equal(idsFlag.error.code, "SEND_ALL_REJECTED");

  const tools = await runCli(["node", "cli", "tools"]);
  assert.equal(tools.ok, true);
  if (!tools.ok) return;
  assert.equal((tools.data as { cli: Record<string, string> }).cli["send-outreach"], "send_outreach");
});
