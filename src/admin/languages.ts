export const INSTRUCTION_LANGUAGES = ["GE", "EN", "RU", "DE", "FR"] as const;
export type InstructionLanguage = (typeof INSTRUCTION_LANGUAGES)[number];

export const BILINGUAL_PAIRS = [
  ["RU", "EN"],
  ["EN", "GE"],
  ["GE", "RU"],
  ["DE", "EN"],
  ["DE", "GE"],
  ["DE", "RU"],
  ["FR", "EN"],
  ["FR", "GE"],
  ["FR", "RU"],
  ["FR", "DE"],
] as const satisfies readonly (readonly [InstructionLanguage, InstructionLanguage])[];

export type BilingualPair = (typeof BILINGUAL_PAIRS)[number];

const BILINGUAL_PREFIX = "bilingual:";

export type InstructionItem =
  | { kind: "single"; language: InstructionLanguage }
  | { kind: "bilingual"; pair: BilingualPair };

function isInstructionLanguage(value: string): value is InstructionLanguage {
  return (INSTRUCTION_LANGUAGES as readonly string[]).includes(value);
}

function pairKey(left: string, right: string): string {
  return [left, right].sort().join("/");
}

const PAIR_BY_KEY = new Map<string, BilingualPair>(
  BILINGUAL_PAIRS.map((pair) => [pairKey(pair[0], pair[1]), pair])
);

export function singleLanguageToken(language: InstructionLanguage): string {
  return language;
}

export function bilingualToken(pair: readonly [InstructionLanguage, InstructionLanguage]): string {
  const known = PAIR_BY_KEY.get(pairKey(pair[0], pair[1]));
  const canonical = known ?? pair;
  return `${BILINGUAL_PREFIX}${canonical[0]}/${canonical[1]}`;
}

export function parseInstructionLanguages(value: string): InstructionLanguage[] {
  const found = new Set(
    value
      .replace(/bilingual:/gi, "")
      .split(/[^a-zA-Z]+/)
      .map((part) => part.trim().toUpperCase())
      .filter(isInstructionLanguage)
  );
  return INSTRUCTION_LANGUAGES.filter((code) => found.has(code));
}

function parseSegment(segment: string): InstructionItem | null {
  const trimmed = segment.trim();
  if (!trimmed) return null;
  const marked = trimmed.match(/^bilingual:\s*([A-Za-z]{2})\s*\/\s*([A-Za-z]{2})$/i);
  if (marked) {
    const pair = PAIR_BY_KEY.get(pairKey(marked[1].toUpperCase(), marked[2].toUpperCase()));
    return pair ? { kind: "bilingual", pair } : null;
  }
  const codes = parseInstructionLanguages(trimmed);
  if (codes.length === 1) return { kind: "single", language: codes[0] };
  if (codes.length === 2) {
    const pair = PAIR_BY_KEY.get(pairKey(codes[0], codes[1]));
    return pair ? { kind: "bilingual", pair } : null;
  }
  return null;
}

function itemToken(item: InstructionItem): string {
  return item.kind === "single" ? item.language : bilingualToken(item.pair);
}

export function parseInstructionItems(value: string): InstructionItem[] {
  const raw = value.trim();
  if (!raw) return [];
  const segments = raw.includes(",") ? raw.split(",") : [raw];
  const parsed = segments
    .map(parseSegment)
    .filter((item): item is InstructionItem => item !== null);
  const items = parsed.length > 0 || raw.includes(",") ? parsed : singlesFromCodes(raw);
  return orderInstructionItems(items);
}

function singlesFromCodes(value: string): InstructionItem[] {
  return parseInstructionLanguages(value).map((language) => ({ kind: "single", language }));
}

function orderInstructionItems(items: readonly InstructionItem[]): InstructionItem[] {
  const singles = new Set(items.filter((item) => item.kind === "single").map((item) => item.language));
  const pairs = new Set(
    items
      .filter((item) => item.kind === "bilingual")
      .map((item) => pairKey(item.pair[0], item.pair[1]))
  );
  const ordered: InstructionItem[] = [];
  for (const language of INSTRUCTION_LANGUAGES) {
    if (singles.has(language)) ordered.push({ kind: "single", language });
  }
  for (const pair of BILINGUAL_PAIRS) {
    if (pairs.has(pairKey(pair[0], pair[1]))) ordered.push({ kind: "bilingual", pair });
  }
  return ordered;
}

export function formatInstructionItems(items: readonly InstructionItem[]): string {
  return orderInstructionItems(items).map(itemToken).join(", ");
}

export function instructionTokens(value: string): string[] {
  return parseInstructionItems(value).map(itemToken);
}

export function normalizeInstructionLanguages(value: string): string {
  return formatInstructionItems(parseInstructionItems(value));
}

export function toggleInstructionToken(value: string, token: string): string {
  const tokens = new Set(parseInstructionItems(value).map(itemToken));
  if (tokens.has(token)) tokens.delete(token);
  else tokens.add(token);
  return normalizeInstructionLanguages([...tokens].join(", "));
}

export function formatInstructionLanguagesLabel(value: string, bilingualLabel: string): string {
  const items = parseInstructionItems(value);
  if (items.length === 0) return value.trim();
  const prefix = bilingualLabel.trim();
  return items
    .map((item) => {
      if (item.kind === "single") return item.language;
      const pair = `${item.pair[0]}/${item.pair[1]}`;
      return prefix ? `${prefix} ${pair}` : pair;
    })
    .join(", ");
}
