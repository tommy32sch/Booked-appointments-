# booked-appointments

Agent-first booked-appointment job runner: an **MCP server** and a matching **CLI**.

V1 playbook: **US commercial janitorial / contract cleaning**. The offer is an **exclusive, calendar-booked walkthrough** — not a shared inbound lead.

This is not a human-click web app. See **[docs/agent.md](docs/agent.md)** for the job loop, tools, inputs, and what **done** means.

## Install

Node 18.18+. From this repo:

```bash
npm install
```

That compiles `dist/` (`prepare` → `tsc`). Bins:

- `booked-appointments` — CLI (1:1 with MCP tools)
- `booked-appointments-mcp` — stdio MCP server

```bash
npx booked-appointments help
npx booked-appointments playbook
npm test
```

## What an agent can do in v1

| Step | MCP tool | CLI |
|---|---|---|
| Load janitorial ICP / offer / compliance | `playbook` | `playbook` |
| Normalize public records + get search queries | `find_targets` | `find-targets` |
| List stored targets | `list_targets` | `list-targets` |
| Qualify one target (rule-based) | `score_target` | `score-target` |
| Draft exclusive-walkthrough outreach (does not send) | `draft_outreach` | `draft-outreach` |
| Send one captain-approved email (SMTP; no send-all) | `send_outreach` | `send-outreach` |
| Calendar **stub** + next hook | `calendar_booking` | `calendar-booking` |

`find_targets` does **not** call Google Maps or LinkedIn. Pass structured public records you already have, and/or run the returned query pack on public sources.

`calendar_booking` is a **clean stub**: no live Google Calendar integration, no fake OAuth. It returns `next_hook.create_exclusive_walkthrough_event` for a later connector.

`draft_outreach` is draft-only. Sending is a separate **review-gated** step: captain reviews that one message, then `send_outreach` / `send-outreach` with `approved=true`. One target + one channel + one draft per call. No send-all, no default send. Email is the only v1 send path (real SMTP). Phone and LinkedIn return `CHANNEL_NOT_SENDABLE`. If `SMTP_USER` / `SMTP_PASS` are missing, the tool returns `SEND_NOT_CONFIGURED` and does **not** fake a send. `send_status=sent` only after a real transport accepts the message.

**Send done-definition:** this one approved email was handed to a real SMTP transport — or the typed config error.

SMTP env: `SMTP_USER`, `SMTP_PASS` (required Gmail/SMTP credential), `SMTP_HOST` (default `smtp.gmail.com`), `SMTP_PORT`, `SMTP_FROM`, optional `SMTP_SECURE`.

## CLI (JSON in / JSON out)

```bash
npx booked-appointments playbook
npx booked-appointments find-targets --input fixtures/example-targets.json --geo "Austin, TX"
npx booked-appointments list-targets
npx booked-appointments score-target --id <id>
npx booked-appointments draft-outreach --id <id> --channel email
npx booked-appointments send-outreach --id <id> --channel email --approved true
npx booked-appointments calendar-booking --id <id>
```

`--store` defaults to `.booked-appointments/store.json`.

`fixtures/example-targets.json` is **example data with no source**, not real customers.

## MCP (stdio)

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

From a clone, `node dist/mcp.js` is equivalent after `npm install`.

## Sourced context only

- ~$197–$230 Google Ads CPL (99 Calls)
- $135 PPA / $910–$1,560/mo appointment packages (JanitorialAppointment)
- Census 2022: ~62,970 janitorial employer firms, 89% <20 employees

Public end-leads only. No patient/PHI scrape. TCPA / CAN-SPAM apply to outreach.

## License

MIT
