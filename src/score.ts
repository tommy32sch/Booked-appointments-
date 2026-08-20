import type { Qualification, Target, TargetScore } from "./types.js";
import { ICP_SITE_TYPES, ICP_TITLES } from "./playbook.js";

const TITLE_NEEDLES = ICP_TITLES.map((title) => title.toLowerCase());

const RESIDENTIAL_HINTS = [
  "residential house",
  "house cleaning",
  "home cleaning",
  "maid for home",
  "single-family home",
  "residential only"
];

const PHI_HINTS = [
  "patient list",
  "patient records",
  "phi",
  "hipaa scrape",
  "medical records scrape",
  "scrape patients"
];

export function titleFitsIcp(title?: string): boolean {
  if (!title) return false;
  const value = title.toLowerCase();
  return TITLE_NEEDLES.some((needle) => value.includes(needle.toLowerCase()));
}

export function isUsAddress(target: Target): boolean | null {
  const country = target.address?.country?.trim().toUpperCase();
  if (country) {
    return country === "US" || country === "USA" || country === "UNITED STATES";
  }
  const state = target.address?.state?.trim();
  if (state && /^[A-Za-z]{2}$/.test(state)) return true;
  if (target.address?.city) return null;
  return null;
}

export function hasPublicContact(target: Target): boolean {
  const contact = target.public_contact;
  return Boolean(contact?.email || contact?.phone || contact?.website);
}

function blob(target: Target): string {
  return [target.name, target.notes, target.site_type, target.decision_maker?.title]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function residentialReject(target: Target): string | null {
  const text = blob(target);
  if (RESIDENTIAL_HINTS.some((hint) => text.includes(hint))) {
    return "Looks like residential house cleaning, not a commercial contract site.";
  }
  if (target.site_type === "other" && text.includes("residential")) {
    return "Site type is not commercial ICP and notes indicate residential.";
  }
  return null;
}

export function phiReject(target: Target): string | null {
  const text = blob(target);
  if (PHI_HINTS.some((hint) => text.includes(hint))) {
    return "Record appears to target patients or PHI. Public facility buildings are in-scope; patient data is not.";
  }
  return null;
}

export function scoreTarget(target: Target): TargetScore {
  const rejects: string[] = [];
  const reasons: string[] = [];

  const residential = residentialReject(target);
  if (residential) rejects.push(residential);
  const phi = phiReject(target);
  if (phi) rejects.push(phi);

  const us = isUsAddress(target);
  if (us === false) rejects.push("Geography is not US.");

  if (!target.name || target.name === "Unnamed target") {
    rejects.push("Missing a usable site / business name.");
  }

  const siteMax = 30;
  const geoMax = 15;
  const titleMax = 25;
  const contactMax = 20;
  const commercialMax = 10;
  const max_score = siteMax + geoMax + titleMax + contactMax + commercialMax;

  const icpSite = target.site_type && (ICP_SITE_TYPES as readonly string[]).includes(target.site_type);
  const sitePoints = icpSite ? siteMax : target.site_type === "other" ? 0 : 10;
  if (icpSite) reasons.push(`Site type '${target.site_type}' matches commercial janitorial ICP.`);
  else if (!target.site_type) reasons.push("Site type missing; treat as review.");
  else reasons.push(`Site type '${target.site_type}' is outside core ICP.`);

  let geoPoints = 0;
  if (us === true) {
    geoPoints = geoMax;
    reasons.push("US geography signal present.");
  } else if (us === null) {
    geoPoints = 6;
    reasons.push("Geography incomplete; not treated as non-US.");
  } else {
    reasons.push("Non-US geography.");
  }

  const titleOk = titleFitsIcp(target.decision_maker?.title);
  const titlePoints = titleOk ? titleMax : target.decision_maker?.title ? 8 : 0;
  if (titleOk) reasons.push(`Decision-maker title fits ICP (${target.decision_maker?.title}).`);
  else if (target.decision_maker?.title) reasons.push("Decision-maker title present but not an ICP match.");
  else reasons.push("No decision-maker title.");

  const contactOk = hasPublicContact(target);
  const contactPoints = contactOk ? contactMax : 0;
  if (contactOk) reasons.push("Public contact channel present (email, phone, or website).");
  else reasons.push("No public email, phone, or website on the record.");

  const commercialPoints = residential ? 0 : commercialMax;
  if (!residential) reasons.push("No residential-house-cleaning reject.");

  const score = rejects.length > 0 ? 0 : sitePoints + geoPoints + titlePoints + contactPoints + commercialPoints;

  let qualification: Qualification;
  if (rejects.length > 0) qualification = "disqualified";
  else if (score >= 70 && icpSite) qualification = "qualified";
  else qualification = "review";

  return {
    target_id: target.id,
    qualification,
    score,
    max_score,
    dimensions: [
      { id: "site_type", label: "Commercial site type", points: rejects.length ? 0 : sitePoints, max: siteMax, note: target.site_type ?? "missing" },
      { id: "geography", label: "US geography", points: rejects.length ? 0 : geoPoints, max: geoMax, note: us === true ? "US" : us === false ? "non-US" : "incomplete" },
      { id: "decision_maker", label: "ICP decision-maker title", points: rejects.length ? 0 : titlePoints, max: titleMax, note: target.decision_maker?.title ?? "missing" },
      { id: "public_contact", label: "Public contact channel", points: rejects.length ? 0 : contactPoints, max: contactMax, note: contactOk ? "present" : "missing" },
      { id: "commercial", label: "Commercial (not residential house)", points: rejects.length ? 0 : commercialPoints, max: commercialMax, note: residential ? "reject" : "ok" }
    ],
    rejects,
    reasons,
    example: target.example,
    note: "Rule-based ICP fit only. No conversion rate, close rate, or revenue estimate is claimed."
  };
}
