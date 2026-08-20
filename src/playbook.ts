/**
 * V1 playbook: US commercial janitorial / contract cleaning.
 *
 * Market figures below are sourced context only. Do not invent extra stats.
 * - 99 Calls: ~$197–$230 Google Ads CPL
 * - JanitorialAppointment: $135 PPA / $910–$1,560/mo appointment packages
 * - Census 2022: ~62,970 janitorial employer firms, 89% <20 employees
 */

export const JANITORIAL_VERTICAL = "janitorial" as const;

export const SOURCED_MARKET_CONTEXT = {
  note: "Sourced market context only. Not a forecast and not a conversion claim.",
  buyer_alternatives: [
    {
      source: "99 Calls",
      figure: "about $197–$230 Google Ads CPL"
    },
    {
      source: "JanitorialAppointment",
      figure: "$135 PPA / $910–$1,560/mo appointment packages"
    }
  ],
  census_2022: {
    source: "Census 2022",
    janitorial_employer_firms: "about 62,970",
    share_under_20_employees: "89%"
  }
} as const;

export const COMPLIANCE_NOTES = {
  public_end_leads_only: "Use public end-leads only (Maps, sites, LinkedIn). This product does not call those APIs.",
  no_phi: "Do not scrape patients or PHI. A medical/office building as a facility to clean is in-scope; patient lists are not.",
  tcpa: "TCPA applies to calls and texts. Drafts are not permission to autodial or text. The calling agent / buyer must have a lawful basis before outreach.",
  can_spam: "CAN-SPAM applies to commercial email. Drafts include identify-sender, physical-address, and unsubscribe placeholders. Sending is out of band.",
  no_protected_systems: "Public-info approaches only. Do not exploit or scrape protected systems."
} as const;

export const ICP_SITE_TYPES = ["office", "warehouse", "restaurant", "facility", "property"] as const;

export const ICP_TITLES = [
  "Facilities Manager",
  "Facility Manager",
  "Director of Facilities",
  "Operations Manager",
  "Property Manager",
  "Building Manager",
  "Office Manager",
  "General Manager",
  "Owner",
  "Restaurant Manager",
  "Warehouse Manager"
] as const;

export function getJanitorialPlaybook() {
  return {
    id: "janitorial_us_v1",
    vertical: JANITORIAL_VERTICAL,
    geography: "US",
    buyer: {
      later_customer_of_this_product: "Janitorial company owner / GM",
      job: "Buy exclusive, calendar-booked walkthroughs with facility decision-makers — not shared inbound leads."
    },
    end_lead: {
      who: "Facility / office / warehouse / restaurant / property decision-maker who will take a walkthrough for a new cleaning contract",
      site_types: [...ICP_SITE_TYPES],
      example_titles: [...ICP_TITLES]
    },
    offer: {
      encodes: "exclusive, calendar-booked walkthroughs",
      not: "shared inbound leads",
      walkthrough: "On-site walkthrough of the facility so the janitorial buyer can scope a contract. One booked slot for this buyer and this site."
    },
    sourced_market_context: SOURCED_MARKET_CONTEXT,
    compliance: COMPLIANCE_NOTES,
    icp_filters: {
      include: {
        geography: "United States",
        site_types: [...ICP_SITE_TYPES],
        commercial: true,
        has_or_can_reach_decision_maker: true
      },
      exclude: {
        residential_house_cleaning: true,
        patient_or_phi_lists: true,
        non_us: true,
        shared_lead_marketplaces_as_the_offer: true
      }
    },
    public_search: {
      this_product_does_not_call_search_apis: true,
      sources_the_calling_agent_may_use: ["Google Maps (public)", "company websites", "LinkedIn (public)"],
      query_templates: publicSearchQueries("{geo}")
    },
    tools: {
      playbook: "Return this playbook (rules / ICP / offer / compliance).",
      find_targets: "Normalize structured public records the agent already has, and/or return search queries + ICP filters. No live Maps/LinkedIn API calls.",
      list_targets: "List normalized / stored targets.",
      score_target: "Rule-based qualify. No invented conversion rates.",
      draft_outreach: "Draft outreach whose ask is an exclusive walkthrough. Does not send.",
      calendar_booking: "Clean stub. States the next hook for a real calendar connector. No OAuth, no live Google Calendar."
    },
    job_loop: [
      "1. playbook — load janitorial rules, ICP, offer, compliance.",
      "2. find_targets — get query pack for a US geo; ingest any structured public records you already collected.",
      "3. list_targets — see normalized targets in the job store.",
      "4. score_target — qualify; skip disqualified (residential, PHI, non-US).",
      "5. draft_outreach — draft email/phone/LinkedIn aimed at booking an exclusive walkthrough. Agent/buyer sends out of band under TCPA/CAN-SPAM.",
      "6. calendar_booking — v1 returns a stub + next hook. A later connector creates the exclusive walkthrough event."
    ],
    done: {
      definition: "An exclusive walkthrough is booked on a calendar for this buyer and this site. Not a shared inbound lead.",
      v1: "Calendar booking is stubbed. Tools through draft_outreach are live on fixture/public-structured input. calendar_booking describes the next hook only."
    }
  };
}

export function publicSearchQueries(geo: string) {
  const place = geo.trim() || "{geo}";
  return {
    geo: place,
    maps: [
      `office building ${place}`,
      `commercial office park ${place}`,
      `warehouse ${place}`,
      `industrial park ${place}`,
      `restaurant ${place}`,
      `property management ${place}`,
      `medical office building ${place}`
    ],
    web: [
      `facility manager contact ${place} office`,
      `property management company ${place}`,
      `warehouse operations ${place} contact`
    ],
    linkedin: [
      `"Facilities Manager" ${place}`,
      `"Property Manager" ${place}`,
      `"Operations Manager" warehouse OR office ${place}`,
      `"Office Manager" ${place} facility OR building`
    ],
    notes: [
      "Run these yourself on public sources. This product does not call Google Maps or LinkedIn APIs.",
      "A medical office building is a facility (in-scope). Do not collect patient or PHI records.",
      "Prefer public contact pages, Maps business listings, and public LinkedIn profiles."
    ]
  };
}

export function resolvePlaybook(vertical?: string) {
  const value = (vertical ?? JANITORIAL_VERTICAL).toLowerCase();
  if (value !== JANITORIAL_VERTICAL) {
    return null;
  }
  return getJanitorialPlaybook();
}
