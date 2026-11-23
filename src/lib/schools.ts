export const SUPPORTED_UI_LANGS = ["en", "ru", "ge", "de"] as const;
export type UiLang = (typeof SUPPORTED_UI_LANGS)[number];

export function isSupportedUiLang(value: string | undefined): value is UiLang {
  return !!value && (SUPPORTED_UI_LANGS as readonly string[]).includes(value);
}

export function isSafeSchoolIdentifier(identifier: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(identifier);
}

export function uiLanguageFromTags(tags: readonly string[]): UiLang {
  for (const raw of tags) {
    const base = raw.toLowerCase().split("-")[0];
    if (base === "ka" || base === "ge") return "ge";
    if (isSupportedUiLang(base)) return base;
  }
  return "en";
}

export function detectBrowserUiLanguage(): UiLang {
  if (typeof navigator === "undefined") return "en";
  return uiLanguageFromTags([navigator.language, ...(navigator.languages ?? [])]);
}

/** Prefer the visitor's Accept-Language order. `ka` is the same UI as `ge`. */
export function uiLanguageFromAcceptLanguage(header: string | undefined): UiLang {
  if (!header) return "en";
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((item) => item.trim().toLowerCase().startsWith("q="));
      const q = qParam ? Number(qParam.trim().slice(2)) : 1;
      return { tag: tag.trim(), q: Number.isFinite(q) ? q : 0 };
    })
    .filter((item) => item.tag && item.tag !== "*")
    .sort((a, b) => b.q - a.q);
  return uiLanguageFromTags(ranked.map((item) => item.tag));
}

export function normalizeUiLanguage(lang: string): UiLang {
  const base = lang.toLowerCase().split("-")[0];
  if (base === "ru") return "ru";
  if (base === "ge" || base === "ka") return "ge";
  if (base === "de") return "de";
  return "en";
}

export type SchoolReturnTo = "catalog" | "map" | "assistant";

export function schoolReturnTo(search: string): SchoolReturnTo {
  const from = new URLSearchParams(search).get("from");
  if (from === "map" || from === "assistant" || from === "catalog") return from;
  return "catalog";
}

export function replaceLangPrefix(pathname: string, nextLang: UiLang): string {
  const rest = pathname.replace(/^\/[^/]+/, "");
  return `/${nextLang}${rest || ""}`;
}
