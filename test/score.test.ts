import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { scoreTarget } from "../src/score.js";
import { normalizeTarget, normalizeTargets } from "../src/targets.js";
import type { RawTarget } from "../src/types.js";

test("example office park qualifies; residential example is disqualified", async () => {
  const file = JSON.parse(await readFile(new URL("../fixtures/example-targets.json", import.meta.url), "utf8")) as {
    records: RawTarget[];
  };
  const [office, warehouse, homes] = normalizeTargets(file.records);
  const officeScore = scoreTarget(office);
  assert.equal(officeScore.qualification, "qualified");
  assert.equal(officeScore.score, 100);
  assert.ok(officeScore.example);
  assert.match(officeScore.note, /No conversion rate/);

  const warehouseScore = scoreTarget(warehouse);
  assert.equal(warehouseScore.qualification, "qualified");

  const homesScore = scoreTarget(homes);
  assert.equal(homesScore.qualification, "disqualified");
  assert.equal(homesScore.score, 0);
  assert.ok(homesScore.rejects.some((r) => /residential/i.test(r)));
});

test("PHI-looking records are rejected without treating a medical building as PHI", () => {
  const building = scoreTarget(
    normalizeTarget({
      name: "Example Medical Office Building",
      example: true,
      site_type: "facility",
      address: { city: "Phoenix", state: "AZ", country: "US" },
      decision_maker: { title: "Facilities Manager" },
      public_contact: { website: "https://example-mob.example" }
    })
  );
  assert.equal(building.qualification, "qualified");

  const phi = scoreTarget(
    normalizeTarget({
      name: "Example Clinic",
      example: true,
      site_type: "facility",
      notes: "patient list for outreach",
      address: { country: "US" }
    })
  );
  assert.equal(phi.qualification, "disqualified");
  assert.ok(phi.rejects.some((r) => /PHI/i.test(r)));
});
