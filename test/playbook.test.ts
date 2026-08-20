import assert from "node:assert/strict";
import { test } from "node:test";
import { getJanitorialPlaybook, publicSearchQueries, resolvePlaybook } from "../src/playbook.js";
import { runPlaybook } from "../src/tools.js";

test("playbook includes only sourced market figures", async () => {
  const playbook = getJanitorialPlaybook();
  const json = JSON.stringify(playbook);
  assert.match(json, /\$197–\$230/);
  assert.match(json, /99 Calls/);
  assert.match(json, /\$135 PPA/);
  assert.match(json, /\$910–\$1,560/);
  assert.match(json, /JanitorialAppointment/);
  assert.match(json, /62,970/);
  assert.match(json, /89%/);
  assert.match(json, /Census 2022/);
  assert.equal(playbook.offer.not, "shared inbound leads");
  assert.match(playbook.offer.encodes, /exclusive/);
  assert.match(playbook.done.v1, /stub/);
});

test("playbook tool rejects unknown verticals", async () => {
  const result = await runPlaybook({ vertical: "dental" });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "UNSUPPORTED_VERTICAL");
  assert.equal(resolvePlaybook("dental"), null);
});

test("query pack does not claim live API access", () => {
  const pack = publicSearchQueries("Austin, TX");
  assert.equal(pack.geo, "Austin, TX");
  assert.ok(pack.maps.some((q) => q.includes("office building Austin, TX")));
  assert.ok(pack.notes.some((n) => n.includes("does not call Google Maps")));
});
