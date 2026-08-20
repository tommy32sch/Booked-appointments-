import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { runCli } from "../src/cli.js";
import { resetStoreCache } from "../src/store.js";
import {
  runCalendarBooking,
  runDraftOutreach,
  runFindTargets,
  runListTargets,
  runPlaybook,
  runScoreTarget
} from "../src/tools.js";
import type { RawTarget } from "../src/types.js";

const fixturePath = fileURLToPath(new URL("../fixtures/example-targets.json", import.meta.url));

async function fixtureRecords(): Promise<RawTarget[]> {
  const file = JSON.parse(await readFile(fixturePath, "utf8")) as { records: RawTarget[] };
  return file.records;
}

test("tool loop: find, list, score, draft, calendar stub on fixture input", async () => {
  resetStoreCache();
  const store_path = path.join(await mkdtemp(path.join(tmpdir(), "ba-")), "store.json");
  const records = await fixtureRecords();

  const found = await runFindTargets({ records, geo: "Austin, TX", persist: true, store_path });
  assert.equal(found.ok, true);
  if (!found.ok) return;
  const data = found.data as {
    api_calls: unknown[];
    ingested: { count: number; targets: { id: string; name: string }[] };
    public_search: { maps: string[] };
  };
  assert.deepEqual(data.api_calls, []);
  assert.equal(data.ingested.count, 3);
  assert.ok(data.public_search.maps.length > 0);

  const listed = await runListTargets({ store_path });
  assert.equal(listed.ok, true);
  if (!listed.ok) return;
  assert.equal((listed.data as { count: number }).count, 3);

  const office = data.ingested.targets.find((t) => t.name === "Example Office Park LLC");
  assert.ok(office);

  const scored = await runScoreTarget({ id: office.id, store_path });
  assert.equal(scored.ok, true);
  if (!scored.ok) return;
  assert.equal((scored.data as { score: { qualification: string } }).score.qualification, "qualified");

  const draft = await runDraftOutreach({ id: office.id, store_path, channel: "email" });
  assert.equal(draft.ok, true);
  if (!draft.ok) return;
  assert.match(JSON.stringify(draft.data), /exclusive walkthrough/i);

  const cal = await runCalendarBooking({ id: office.id, store_path });
  assert.equal(cal.ok, true);
  if (!cal.ok) return;
  assert.equal((cal.data as { status: string }).status, "stub");
});

test("CLI maps 1:1 onto tools for playbook, ingest, score, draft, calendar", async () => {
  resetStoreCache();
  const store = path.join(await mkdtemp(path.join(tmpdir(), "ba-cli-")), "store.json");

  const playbook = await runCli(["node", "cli", "playbook"]);
  assert.equal(playbook.ok, true);
  assert.match(JSON.stringify(playbook.data), /janitorial_us_v1/);

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
  const office = (find.data as { ingested: { targets: { id: string; name: string }[] } }).ingested.targets.find(
    (t) => t.name === "Example Office Park LLC"
  );
  assert.ok(office);

  const list = await runCli(["node", "cli", "list-targets", "--store", store]);
  assert.equal(list.ok, true);

  const score = await runCli(["node", "cli", "score-target", "--id", office.id, "--store", store]);
  assert.equal(score.ok, true);

  const outreach = await runCli(["node", "cli", "draft-outreach", "--id", office.id, "--channel", "email", "--store", store]);
  assert.equal(outreach.ok, true);

  const calendar = await runCli(["node", "cli", "calendar-booking", "--id", office.id, "--store", store]);
  assert.equal(calendar.ok, true);
  if (!calendar.ok) return;
  assert.equal((calendar.data as { status: string; oauth: boolean }).status, "stub");
  assert.equal((calendar.data as { oauth: boolean }).oauth, false);

  const tools = await runCli(["node", "cli", "tools"]);
  assert.equal(tools.ok, true);
  if (!tools.ok) return;
  assert.deepEqual((tools.data as { tools: string[] }).tools, [
    "playbook",
    "find_targets",
    "list_targets",
    "score_target",
    "draft_outreach",
    "calendar_booking"
  ]);
});

test("playbook tool is reachable via handler", async () => {
  const result = await runPlaybook({});
  assert.equal(result.ok, true);
});
