import { createRequire } from "node:module";
import { incrementVisitCount, listVisitDays, type VisitDay } from "../db/queries";

const require = createRequire(import.meta.url);
const geoip = require("geoip-lite") as {
  lookup(ip: string): { country?: string } | null;
};

const TBILISI = "Asia/Tbilisi";

export function tbilisiDay(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TBILISI,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function countryCode(address: string): string {
  const ip = address.startsWith("::ffff:") ? address.slice(7) : address;
  const country = geoip.lookup(ip)?.country;
  return typeof country === "string" && /^[A-Z]{2}$/.test(country) ? country : "unknown";
}

export async function recordVisit(remoteAddress: string | undefined): Promise<void> {
  await incrementVisitCount(tbilisiDay(), countryCode(remoteAddress ?? ""));
}

export async function visitDays(): Promise<VisitDay[]> {
  return listVisitDays();
}
