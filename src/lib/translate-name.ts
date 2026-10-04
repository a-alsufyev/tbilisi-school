import { ADMIN_LOCALES, type AdminLocale, type AdminTranslation } from "../admin/types";

const API_LANG: Record<AdminLocale, string> = {
  en: "en",
  ru: "ru",
  ge: "ka",
  de: "de",
};

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanTranslation(value: string): string | null {
  const text = decodeEntities(value).trim();
  if (!text || /MYMEMORY WARNING/i.test(text) || /INVALID LANGUAGE PAIR/i.test(text)) return null;
  return text;
}

async function translateMyMemory(text: string, from: string, to: string): Promise<string | null> {
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", `${from}|${to}`);
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) return null;
  const body = (await response.json()) as { responseData?: { translatedText?: string } };
  return cleanTranslation(body.responseData?.translatedText ?? "");
}

async function translateGoogle(text: string, from: string, to: string): Promise<string | null> {
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", from);
  url.searchParams.set("tl", to);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text);
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) return null;
  const body = (await response.json()) as Array<Array<[string]>>;
  const translated = body?.[0]?.map((part) => part[0]).join("") ?? "";
  return cleanTranslation(translated);
}

async function translateText(text: string, from: AdminLocale, to: AdminLocale): Promise<string | null> {
  const source = API_LANG[from];
  const target = API_LANG[to];
  try {
    const google = await translateGoogle(text, source, target);
    if (google) return google;
  } catch (error) {
    console.error(`Google translate ${source}->${target} failed:`, error);
  }
  try {
    return await translateMyMemory(text, source, target);
  } catch (error) {
    console.error(`MyMemory translate ${source}->${target} failed:`, error);
    return null;
  }
}

export async function fillMissingNameTranslations(
  translations: Record<AdminLocale, AdminTranslation>
): Promise<{ translations: Record<AdminLocale, AdminTranslation>; incomplete: boolean }> {
  const next: Record<AdminLocale, AdminTranslation> = {
    en: { ...translations.en },
    ru: { ...translations.ru },
    ge: { ...translations.ge },
    de: { ...translations.de },
  };
  const filled = ADMIN_LOCALES.filter((locale) => next[locale].name.trim());
  const missing = ADMIN_LOCALES.filter((locale) => !next[locale].name.trim());
  if (filled.length === 0 || missing.length === 0) {
    return { translations: next, incomplete: false };
  }

  const source = filled[0];
  const sourceName = next[source].name.trim();
  const results = await Promise.all(
    missing.map(async (locale) => ({
      locale,
      name: await translateText(sourceName, source, locale),
    }))
  );

  let incomplete = false;
  for (const result of results) {
    if (!result.name) {
      incomplete = true;
      continue;
    }
    next[result.locale] = { ...next[result.locale], name: result.name };
  }
  return { translations: next, incomplete };
}
