# Agent guide — booked-appointments v1

You are running a **booked-appointment job**, not a human web app. This package is an MCP server plus a matching CLI. JSON in, JSON out.

## Offer

Book **exclusive, calendar-booked walkthroughs** for a US commercial janitorial / contract-cleaning buyer.

- Later buyer of this product: janitorial company owner / GM.
- End-lead: facility / office / warehouse / restaurant / property decision-maker who will take a walkthrough for a new cleaning contract.
- Not a shared inbound lead.

## Done

**Done** means an exclusive walkthrough is held on a real calendar for this buyer and this site.

In v1, `calendar_booking` is a **clean stub**. It does not call Google Calendar and does not perform OAuth. It returns a structured `next_hook` (`create_exclusive_walkthrough_event`) describing what a later connector needs. Treat a completed draft + stub hook as the v1 stop; do not pretend the slot is live-booked.

## Sourced market context (do not invent more figures)

- Buyers already pay about **$197–$230 Google Ads CPL** (99 Calls) and **$135 PPA / $910–$1,560/mo** appointment packages (JanitorialAppointment).
- Census 2022: about **62,970** janitorial employer firms, **89% <20 employees**.

## Compliance

- Public end-leads only (Maps, sites, LinkedIn). This product does **not** call those APIs.
- No patient / PHI scrape. A medical office *building* as a facility to clean is in-scope; patient lists are not.
- TCPA applies to calls/texts. CAN-SPAM applies to email. `draft_outreach` does not send. Sending is a separate, review-gated `send_outreach` call.

## Job loop

1. `playbook` — load janitorial rules, ICP, offer, compliance, done definition.
2. `find_targets` — for a US geo, take the query pack and run it yourself on public sources. Ingest any structured public records you already have (`records`). Do not invent customers.
3. `list_targets` — inspect normalized records in the job store.
4. `score_target` — qualify. Skip `disqualified` (residential house cleaning, PHI, non-US).
5. `draft_outreach` — draft email / phone / LinkedIn whose ask is an exclusive walkthrough. Draft only. Does not send.
6. Human / captain reviews **that one message**. No send-all. No send-by-default.
7. `send_outreach` — only after `approved=true` (boolean) on that one message. One target + one channel + one draft per call. Email is handed to a real SMTP transport, or you get `SEND_NOT_CONFIGURED`. Phone / LinkedIn return `CHANNEL_NOT_SENDABLE`.
8. `calendar_booking` — v1 stub + next hook. Stop. Do not fake a booked event.

## Tools (stable names)

| MCP tool | CLI | Input | Output |
|---|---|---|---|
| `playbook` | `playbook` | `vertical?` (only `janitorial`) | Playbook JSON |
| `find_targets` | `find-targets` | `records?`, `geo?`, `persist?`, `store_path?` | Normalized targets + query pack. `api_calls` is always `[]` |
| `list_targets` | `list-targets` | `store_path?`, `include_examples?` | Stored targets |
| `score_target` | `score-target` | `id?` or `target?`, `store_path?` | Rule-based score. No conversion rates |
| `draft_outreach` | `draft-outreach` | `id?` or `target?`, `channel?`, `buyer_name?` | Draft only (`send_status: draft_only`). Never sends. |
| `send_outreach` | `send-outreach` | one `id?` or `target?`, one `channel?`, `approved` (must be `true`), optional `subject`/`body` | One reviewed email via real SMTP, or a typed error. No send-all. |
| `calendar_booking` | `calendar-booking` | `id?` or `target?`, `proposed_slots?` | Stub + `next_hook` |

**Send review gate**

- `draft_outreach` stays draft-only.
- `send_outreach` / `send-outreach` map 1:1. Captain reviews every outreach message before anything goes out.
- `approved` must be boolean `true` on **that one** message. Missing, `false`, or any other value → `NOT_APPROVED`. No default send.
- One target + one channel + one draft per call. Arrays, glob, and `all` → `SEND_ALL_REJECTED`.
- Email is the only v1 send path. `phone` / `linkedin` → `CHANNEL_NOT_SENDABLE` (do not fake a send).
- Real SMTP only. Required credential env: `SMTP_USER`, `SMTP_PASS` (Gmail app password or SMTP password). Also: `SMTP_HOST` (default `smtp.gmail.com`), `SMTP_PORT`, `SMTP_FROM`, optional `SMTP_SECURE`. Missing credentials → `SEND_NOT_CONFIGURED` naming the missing vars. Never `send_status=sent` unless a real transport accepted the message.
- **Done (send):** this one approved email was handed to a real SMTP transport — or the typed config error.
- TCPA / CAN-SPAM notes stay on the payload. Do not invent market stats or customers.

Errors are `{ "ok": false, "error": { "code", "message" } }` with codes: `INVALID_INPUT`, `TARGET_NOT_FOUND`, `STORE_ERROR`, `UNSUPPORTED_VERTICAL`, `UNKNOWN_TOOL`, `NOT_APPROVED`, `SEND_ALL_REJECTED`, `SEND_NOT_CONFIGURED`, `CHANNEL_NOT_SENDABLE`, `MISSING_RECIPIENT`, `SEND_FAILED`.

## Inputs you must not fake

- Do not call or pretend to call Google Maps, LinkedIn, or calendar APIs through this product.
- If you include sample records, set `"example": true`. Example data has no source and is not a real customer.
- Do not invent stats beyond the sourced context above.

## Install and run

```bash
npm install
npm test
npx booked-appointments playbook
npx booked-appointments find-targets --input fixtures/example-targets.json --geo "Austin, TX"
npx booked-appointments list-targets
npx booked-appointments score-target --id <id>
npx booked-appointments draft-outreach --id <id> --channel email
npx booked-appointments send-outreach --id <id> --channel email --approved true
npx booked-appointments calendar-booking --id <id>
```

MCP (stdio):

```json
{
  "mcpServers": {
    "booked-appointments": {
      "command": "npx",
      "args": ["booked-appointments-mcp"]
    }
  }
}
```

From a clone after `npm install`, `npx booked-appointments-mcp` starts stdio. `stdout` is the protocol channel.

## Store

CLI defaults to `.booked-appointments/store.json` in the cwd. MCP defaults to **in-memory for the process** unless you pass `store_path`. Pass the same `store_path` if the job spans CLI and MCP.
