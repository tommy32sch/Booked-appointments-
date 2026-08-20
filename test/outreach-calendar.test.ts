import assert from "node:assert/strict";
import { test } from "node:test";
import { CALENDAR_STUB_MESSAGE, calendarBookingStub } from "../src/calendar.js";
import { draftOutreach } from "../src/outreach.js";
import { normalizeTarget } from "../src/targets.js";

const target = normalizeTarget({
  example: true,
  name: "Example Office Park LLC",
  site_type: "office",
  address: { city: "Austin", state: "TX", country: "US" },
  decision_maker: { name: "Alex Rivera", title: "Facilities Manager" }
});

test("outreach drafts ask for an exclusive walkthrough and do not send", () => {
  const email = draftOutreach(target, "email", "Example Janitorial Buyer");
  assert.equal(email.send_status, "draft_only");
  assert.equal(email.shared_lead, false);
  assert.match(email.body, /exclusive walkthrough/i);
  assert.match(email.body, /not a shared inbound lead/i);
  assert.match(email.body, /CAN-SPAM/);
  assert.ok(email.compliance.some((c) => /does not send/i.test(c)));

  const phone = draftOutreach(target, "phone");
  assert.match(phone.talk_track ?? "", /exclusive walkthrough/i);
  assert.ok(phone.compliance.some((c) => /TCPA/i.test(c)));
});

test("calendar booking is a stub with a next hook and no OAuth", () => {
  const stub = calendarBookingStub({ target, proposed_slots: ["2026-08-25T15:00:00Z"] });
  assert.equal(stub.status, "stub");
  assert.equal(stub.live_integration, false);
  assert.equal(stub.oauth, false);
  assert.equal(stub.provider, null);
  assert.equal(stub.message, CALENDAR_STUB_MESSAGE);
  assert.equal(stub.next_hook.hook_id, "create_exclusive_walkthrough_event");
  assert.equal(stub.next_hook.proposed_event.shared_lead, false);
  assert.match(stub.next_hook.proposed_event.title, /Example Office Park LLC/);
  assert.ok(stub.next_hook.would_need.some((item) => /oauth_or_api_credentials/i.test(item)));
});
