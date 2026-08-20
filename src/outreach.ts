import type { OutreachChannel, Target } from "./types.js";

export type OutreachDraft = {
  channel: OutreachChannel;
  purpose: "book_exclusive_walkthrough";
  shared_lead: false;
  target_id: string;
  example: boolean;
  subject?: string;
  body: string;
  talk_track?: string;
  compliance: string[];
  send_status: "draft_only";
  note: string;
};

function siteLine(target: Target): string {
  const parts = [target.name];
  if (target.address?.city && target.address?.state) {
    parts.push(`${target.address.city}, ${target.address.state}`);
  } else if (target.address?.city) {
    parts.push(target.address.city);
  }
  return parts.join(" — ");
}

function greeting(target: Target): string {
  const first = target.decision_maker?.name?.trim().split(/\s+/)[0];
  return first ? `Hello ${first},` : "Hello,";
}

function buyerLabel(buyerName?: string): string {
  return buyerName?.trim() || "[janitorial buyer — set buyer_name]";
}

export function draftOutreach(
  target: Target,
  channel: OutreachChannel = "email",
  buyerName?: string
): OutreachDraft {
  const buyer = buyerLabel(buyerName);
  const site = siteLine(target);
  const title = target.decision_maker?.title ?? "facilities / operations";

  const sharedNote =
    "This ask is an exclusive, calendar-booked walkthrough for one janitorial buyer — not a shared inbound lead.";

  const compliance = [
    "Draft only. This product does not send email, place calls, or post on LinkedIn.",
    "TCPA: do not autodial or text a mobile number without the required consent / lawful basis.",
    "CAN-SPAM: commercial email must identify the sender, include a physical postal address, and honor unsubscribe.",
    "Public-info contact only. Do not use this draft against patient/PHI lists."
  ];

  if (channel === "phone") {
    return {
      channel,
      purpose: "book_exclusive_walkthrough",
      shared_lead: false,
      target_id: target.id,
      example: target.example,
      talk_track: [
        `Open: calling from ${buyer} about contract cleaning at ${site}.`,
        `Role check: looking for the ${title} who would walk a new cleaning contractor through the site.`,
        `Offer: one exclusive walkthrough on the calendar — not a shared lead we sell to multiple cleaners.`,
        `Ask: two windows this week or next when someone can walk the floors, restrooms, and service areas.`,
        `Close: confirm site address and who else should attend. Do not pitch a long proposal on first call.`
      ].join(" "),
      body: `Purpose: book an exclusive walkthrough at ${site}. ${sharedNote}`,
      compliance,
      send_status: "draft_only",
      note: sharedNote
    };
  }

  if (channel === "linkedin") {
    return {
      channel,
      purpose: "book_exclusive_walkthrough",
      shared_lead: false,
      target_id: target.id,
      example: target.example,
      subject: `Exclusive walkthrough at ${target.name}`,
      body: [
        greeting(target),
        "",
        `I work with ${buyer}. We book exclusive site walkthroughs for a contract cleaning review — not a shared lead list.`,
        "",
        `If you own facilities / vendor decisions at ${site}, would you take a 20–30 minute walkthrough so the cleaner can scope restrooms, floors, and service areas on a real calendar hold?`,
        "",
        "If you are not the right person, a pointer to the facilities or property lead is enough.",
        "",
        "This is public-professional outreach only."
      ].join("\n"),
      compliance,
      send_status: "draft_only",
      note: sharedNote
    };
  }

  return {
    channel: "email",
    purpose: "book_exclusive_walkthrough",
    shared_lead: false,
    target_id: target.id,
    example: target.example,
    subject: `Requesting an exclusive walkthrough at ${target.name}`,
    body: [
      greeting(target),
      "",
      `${buyer} is looking to schedule an exclusive walkthrough at ${site} to scope a commercial cleaning contract.`,
      "",
      sharedNote,
      "",
      `If you are the ${title} (or can route this), reply with two windows that work. We will hold one calendar slot for this site — not shop the appointment to other cleaners.`,
      "",
      "What we would walk: floors, restrooms, break/service areas, and any after-hours access notes.",
      "",
      "Thank you,",
      buyer,
      "",
      "---",
      "CAN-SPAM placeholders (replace before send):",
      "Sender: [legal sender name]",
      "Physical address: [street, city, state ZIP]",
      "Unsubscribe: Reply STOP or use [unsubscribe URL]"
    ].join("\n"),
    compliance,
    send_status: "draft_only",
    note: sharedNote
  };
}
