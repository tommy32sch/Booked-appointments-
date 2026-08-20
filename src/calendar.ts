import type { Target } from "./types.js";

export const CALENDAR_STUB_MESSAGE =
  "Calendar booking is a clean stub in v1. No Google Calendar or other calendar API is called. No OAuth is performed or faked.";

export type CalendarBookingStub = {
  status: "stub";
  live_integration: false;
  provider: null;
  oauth: false;
  message: typeof CALENDAR_STUB_MESSAGE;
  done_definition: string;
  target_id?: string;
  example?: boolean;
  proposed_slots?: string[];
  next_hook: {
    hook_id: "create_exclusive_walkthrough_event";
    purpose: string;
    would_need: string[];
    proposed_event: {
      title: string;
      type: "exclusive_walkthrough";
      shared_lead: false;
      location: string | null;
      attendees: string[];
      exclusivity: string;
    };
  };
};

export function calendarBookingStub(input?: {
  target?: Target;
  proposed_slots?: string[];
}): CalendarBookingStub {
  const target = input?.target;
  const location = target
    ? [target.name, target.address?.street, target.address?.city, target.address?.state]
        .filter(Boolean)
        .join(", ")
    : null;

  return {
    status: "stub",
    live_integration: false,
    provider: null,
    oauth: false,
    message: CALENDAR_STUB_MESSAGE,
    done_definition:
      "Job is done when an exclusive walkthrough is booked on a real calendar for this buyer and this site. That connector is not implemented in v1.",
    target_id: target?.id,
    example: target?.example,
    proposed_slots: input?.proposed_slots,
    next_hook: {
      hook_id: "create_exclusive_walkthrough_event",
      purpose:
        "A future calendar connector should create one exclusive walkthrough event for this buyer and this site — not a shared inbound lead.",
      would_need: [
        "calendar_provider (google|microsoft|other)",
        "oauth_or_api_credentials for that provider (real; do not fake)",
        "organizer identity (janitorial buyer)",
        "attendee contact (end-lead)",
        "timezone",
        "proposed_slots",
        "site_address_or_maps_link",
        "exclusivity flag = exclusive_walkthrough"
      ],
      proposed_event: {
        title: target
          ? `Exclusive janitorial walkthrough — ${target.name}`
          : "Exclusive janitorial walkthrough",
        type: "exclusive_walkthrough",
        shared_lead: false,
        location,
        attendees: ["end-lead", "janitorial_buyer"],
        exclusivity: "One booked walkthrough for this buyer and this site. Not a shared inbound lead."
      }
    }
  };
}
