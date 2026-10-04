import { placeSpellings, resolveArea, resolveDistrictId } from "./districts";
import type { School } from "../types";
import type { UiLang } from "./schools";

export type QueryTypo = {
  written: string;
  suggestion: string;
  replacement: string;
};

type Term = {
  key: string;
  label: string;
  replacement: string;
};

const CANONICAL = [
  "Cambridge",
  "Edexcel",
  "Pearson",
  "Diploma",
  "International",
  "Curriculum",
  "Alternative",
  "American",
  "British",
  "Finnish",
  "German",
  "Georgian",
  "National",
  "Private",
  "Кембридж",
  "Финская",
  "Национальная",
  "Немецкая",
  "Частная",
  "Альтернативная",
  "Американская",
  "Британская",
  "Грузинская",
  "English",
  "Russian",
  "Georgian",
  "French",
  "Английский",
  "Русский",
  "Грузинский",
  "Немецкий",
  "Французский",
  "Englisch",
  "Russisch",
  "Georgisch",
  "Deutsch",
  "Französisch",
  "ინგლისური",
  "რუსული",
  "ქართული",
  "გერმანული",
  "ფრანგული",
];

const KNOWN_PREFIXES = [
  "русск",
  "английск",
  "англояз",
  "грузин",
  "немец",
  "француз",
  "франц",
  "кембридж",
  "english",
  "russian",
  "georgian",
  "german",
  "french",
  "englisch",
  "russisch",
  "georgisch",
  "deutsch",
  "franz",
  "ინგლის",
  "რუსულ",
  "ქართულ",
  "გერმან",
  "ფრანგ",
  "british",
  "британ",
  "american",
  "американ",
  "national",
  "националь",
  "finnish",
  "финск",
  "finnisch",
  "private",
  "частн",
  "privat",
  "alternative",
  "альтернатив",
  "cambridge",
];

const GENERIC = new Set([
  "school",
  "schools",
  "schule",
  "schulen",
  "школа",
  "школы",
  "школе",
  "школу",
  "школой",
  "სკოლა",
  "სკოლის",
]);

function fold(value: string): string {
  return value.trim().toLowerCase().replace(/ё/g, "е");
}

function scriptOf(value: string): "cyr" | "lat" | "ge" | "other" {
  if (/[ა-ჰ]/.test(value)) return "ge";
  if (/[а-яё]/i.test(value)) return "cyr";
  if (/[a-zäöüß]/i.test(value)) return "lat";
  return "other";
}

export function oneTypo(left: string, right: string): boolean {
  if (left === right) return true;
  if (Math.abs(left.length - right.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (
      left.length === right.length &&
      i + 1 < left.length &&
      j + 1 < right.length &&
      left[i] === right[j + 1] &&
      left[i + 1] === right[j]
    ) {
      i += 2;
      j += 2;
      continue;
    }
    if (left.length > right.length) i += 1;
    else if (right.length > left.length) j += 1;
    else {
      i += 1;
      j += 1;
    }
  }
  if (i < left.length || j < right.length) edits += 1;
  return edits <= 1;
}

function addTerm(terms: Term[], seen: Set<string>, label: string, replacement = label) {
  const key = fold(label);
  if (key.length < 4 || key.includes(" ") || seen.has(key) || GENERIC.has(key)) return;
  const canonical = CANONICAL.find((item) => fold(item) !== key && oneTypo(key, fold(item)));
  if (canonical) return;
  seen.add(key);
  terms.push({ key, label, replacement });
}

function buildTerms(schools: School[]): Term[] {
  const seen = new Set<string>();
  const terms: Term[] = [];
  for (const label of CANONICAL) addTerm(terms, seen, label);
  for (const place of placeSpellings()) {
    const key = place.key;
    if (key.length < 4 || seen.has(key) || GENERIC.has(key)) continue;
    seen.add(key);
    terms.push(place);
  }
  for (const school of schools) {
    const sources = [school.program ?? "", school.name, ...Object.values(school.names)];
    for (const source of sources) {
      for (const word of fold(source).split(/[^\p{L}\p{N}]+/u)) {
        if (word.length < 5) continue;
        const display = source.split(/[^\p{L}\p{N}]+/u).find((item) => fold(item) === word) ?? word;
        addTerm(terms, seen, display);
      }
    }
  }
  return terms;
}

function isKnown(word: string, terms: Term[]): boolean {
  if (terms.some((term) => term.key === word)) return true;
  if (KNOWN_PREFIXES.some((prefix) => word.startsWith(prefix) && word.length > prefix.length)) return true;
  if (resolveDistrictId(word)) return true;
  if (resolveArea(word)) return true;
  return false;
}

function bestHit(word: string, terms: Term[]): Term | null {
  const script = scriptOf(word);
  const hits = terms.filter((term) => scriptOf(term.key) === script && term.key !== word && oneTypo(word, term.key));
  if (hits.length === 0) return null;
  hits.sort((left, right) => {
    const distance = Math.abs(left.key.length - word.length) - Math.abs(right.key.length - word.length);
    if (distance !== 0) return distance;
    return right.key.length - left.key.length;
  });
  const bestDistance = Math.abs(hits[0].key.length - word.length);
  const bestLength = hits[0].key.length;
  const top = hits.filter(
    (hit) => Math.abs(hit.key.length - word.length) === bestDistance && hit.key.length === bestLength
  );
  const labels = new Set(top.map((hit) => hit.label));
  if (labels.size > 1) return null;
  return top[0];
}

function words(text: string): string[] {
  return fold(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length >= 5);
}

export function findQueryTypos(text: string, schools: School[]): QueryTypo[] {
  const terms = buildTerms(schools);
  const found: QueryTypo[] = [];
  const seen = new Set<string>();
  for (const word of words(text)) {
    if (seen.has(word) || isKnown(word, terms)) continue;
    const hit = bestHit(word, terms);
    if (!hit) continue;
    seen.add(word);
    found.push({ written: word, suggestion: hit.label, replacement: hit.replacement });
  }
  return found;
}

export function applyQueryTypos(text: string, typos: QueryTypo[]): string {
  let next = text;
  for (const typo of typos) {
    const escaped = typo.written.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "giu");
    next = next.replace(pattern, typo.replacement);
  }
  return next;
}

function quote(value: string, locale: UiLang): string {
  if (locale === "en" || locale === "de") return `"${value}"`;
  return `«${value}»`;
}

const JOIN: Record<UiLang, string> = {
  en: " and ",
  ru: " и ",
  ge: " და ",
  de: " und ",
};

export function clarificationReply(typos: QueryTypo[], locale: UiLang): string {
  const list = typos.map((typo) => quote(typo.suggestion, locale)).join(JOIN[locale]);
  if (locale === "en") return `Did you mean ${list}?`;
  if (locale === "ge") return `გთხოვთ დააზუსტოთ: იგულისხმეთ ${list}?`;
  if (locale === "de") return `Meinten Sie ${list}?`;
  return `Уточните, пожалуйста: вы имели в виду ${list}?`;
}

export function typoDenialReply(locale: UiLang): string {
  if (locale === "en") return "Please write what you meant.";
  if (locale === "ge") return "გთხოვთ, დაწეროთ, რა იგულისხმეთ.";
  if (locale === "de") return "Bitte schreiben Sie, was Sie meinten.";
  return "Напишите, пожалуйста, что вы имели в виду.";
}

export function isTypoClarification(text: string): boolean {
  return /вы имели в виду|Did you mean|იგულისხმეთ|Meinten Sie/i.test(text);
}

export function isAffirmation(text: string): boolean {
  return /^(да|ага|угу|ок|окей|хорошо|верно|именно|правильно|конечно|yes|yeah|yep|ok|okay|ja|genau|კი|დიახ)[.!?\s]*$/iu.test(
    text.trim()
  );
}

export function isDenial(text: string): boolean {
  return /^(нет|неа|no|nope|nein|არა)[.!?\s]*$/iu.test(text.trim());
}

export function messageLocale(text: string, fallback: UiLang): UiLang {
  if (/[ა-ჰ]/.test(text)) return "ge";
  if (/[а-яё]/i.test(text)) return "ru";
  if (/[äöüß]/i.test(text) || /\b(schule|schulen|bitte|nicht|meinten)\b/i.test(text)) return "de";
  if (/[a-z]/i.test(text)) return "en";
  return fallback;
}
