import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { EXAMPLE_SOURCE_NOTE, looksLikeExample, normalizeTargets } from "../src/targets.js";
import type { RawTarget } from "../src/types.js";

test("fixture records are marked example with no source", async () => {
  const file = JSON.parse(await readFile(new URL("../fixtures/example-targets.json", import.meta.url), "utf8")) as {
    note: string;
    records: RawTarget[];
  };
  assert.match(file.note, /EXAMPLE DATA WITH NO SOURCE/);
  const targets = normalizeTargets(file.records);
  assert.equal(targets.length, 3);
  for (const target of targets) {
    assert.equal(target.example, true);
    assert.equal(target.source, "example");
    assert.match(target.source_note, /Not a real customer/);
  }
});

test("agent-ingested records are not labeled as real customers from this product", () => {
  const [target] = normalizeTargets([
    {
      name: "Acme Facilities Desk",
      site_type: "office",
      address: { city: "Denver", state: "CO", country: "US" }
    }
  ]);
  assert.equal(target.example, false);
  assert.equal(target.source, "agent_ingest");
  assert.match(target.source_note, /calling agent/);
  assert.match(target.source_note, /Not independently verified/);
  assert.equal(looksLikeExample({ name: "Example Office Park LLC", example: true }), true);
  assert.equal(EXAMPLE_SOURCE_NOTE.includes("no source"), true);
});
