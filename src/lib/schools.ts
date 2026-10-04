export const SUPPORTED_UI_LANGS = ["en", "ru", "ge", "de"] as const;
export type UiLang = (typeof SUPPORTED_UI_LANGS)[number];

export function isSupportedUiLang(value: string | undefined): value is UiLang {
  return !!value && (SUPPORTED_UI_LANGS as readonly string[]).includes(value);
}

export function isSafeSchoolIdentifier(identifier: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(identifier);
}

export function detectBrowserUiLanguage(): UiLang {
  if (typeof navigator === "undefined") return "en";
  const candidates = [navigator.language, ...(navigator.languages ?? [])];
  for (const raw of candidates) {
    const base = raw.toLowerCase().split("-")[0];
    if (base === "ka" || base === "ge") return "ge";
    if (isSupportedUiLang(base)) return base;
  }
  return "en";
}

export function normalizeUiLanguage(lang: string): UiLang {
  const base = lang.toLowerCase().split("-")[0];
  if (base === "ru") return "ru";
  if (base === "ge" || base === "ka") return "ge";
  if (base === "de") return "de";
  return "en";
}

export function replaceLangPrefix(pathname: string, nextLang: UiLang): string {
  const rest = pathname.replace(/^\/[^/]+/, "");
  return `/${nextLang}${rest || ""}`;
}
