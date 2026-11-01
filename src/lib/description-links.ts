import { externalHref } from "./website";

export type DescriptionPart =
  | { type: "text"; text: string }
  | { type: "link"; label: string; href: string };

const PATTERN = /\[([^\]\n]+)\]\(([^)\s]+)\)|https?:\/\/[^\s)]+/gi;

function linkPart(label: string, href: string | null, raw: string): DescriptionPart {
  if (!label.trim() || !href || href.includes(")")) return { type: "text", text: raw };
  return { type: "link", label, href };
}

export function descriptionParts(source: string): DescriptionPart[] {
  const parts: DescriptionPart[] = [];
  let cursor = 0;
  for (const match of source.matchAll(PATTERN)) {
    const index = match.index ?? 0;
    const raw = match[0];
    if (index > cursor) parts.push({ type: "text", text: source.slice(cursor, index) });
    if (match[1] !== undefined) {
      parts.push(linkPart(match[1].trim(), externalHref(match[2]), raw));
    } else {
      const trimmed = raw.replace(/[.,;:!?]+$/, "");
      const href = externalHref(trimmed);
      if (href && trimmed !== raw) {
        parts.push(linkPart(trimmed, href, trimmed));
        parts.push({ type: "text", text: raw.slice(trimmed.length) });
      } else {
        parts.push(linkPart(raw, href, raw));
      }
    }
    cursor = index + raw.length;
  }
  if (cursor < source.length) parts.push({ type: "text", text: source.slice(cursor) });
  return parts;
}
