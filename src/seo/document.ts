import { formatInstructionLanguagesLabel, parseInstructionLanguages } from "../admin/languages";
import i18n from "../i18n";
import { escapeHtml } from "../lib/escapeHtml";
import {
  isSafeSchoolIdentifier,
  isSupportedUiLang,
  SUPPORTED_UI_LANGS,
  uiLanguageFromAcceptLanguage,
  type UiLang,
} from "../lib/schools";
import { localizedSchoolName } from "../hooks/useSchoolTranslations";
import type { SchoolNames } from "../types";

const INDEX = "index, follow";
const NOINDEX_FOLLOW = "noindex, follow";
const NOINDEX = "noindex, nofollow";

const HTML_LANG: Record<UiLang, string> = { en: "en", ru: "ru", ge: "ka", de: "de" };
const HREFLANG: Record<UiLang, string> = { en: "en", ru: "ru", ge: "ka", de: "de" };
const OG_LOCALE: Record<UiLang, string> = { en: "en_US", ru: "ru_RU", ge: "ka_GE", de: "de_DE" };
const INSTRUCTION_BCP: Record<string, string> = { EN: "en", RU: "ru", GE: "ka", DE: "de", FR: "fr" };

const STATIC_TAILS = ["", "/map", "/schools", "/directory", "/assistant", "/about"] as const;

const SEGMENT_KIND = {
  map: "map",
  schools: "catalog",
  directory: "directory",
  assistant: "assistant",
  about: "about",
} as const;

type StaticKind = (typeof SEGMENT_KIND)[keyof typeof SEGMENT_KIND];

export type RouteMatch =
  | { kind: "home"; lang: UiLang }
  | { kind: StaticKind; lang: UiLang }
  | { kind: "school"; lang: UiLang; slug: string }
  | { kind: "admin" }
  | { kind: "notFound"; lang: UiLang };

export type SeoSchool = {
  slug: string;
  name: string;
  names: SchoolNames;
  address: string;
  languages: string;
};

export type SeoAlternate = { hreflang: string; href: string };

export type SeoDocument = {
  status: 200 | 404;
  htmlLang: string;
  title: string;
  description: string;
  robots: string;
  canonical: string;
  alternates: SeoAlternate[];
  ogType: "website" | "article";
  ogLocale: string;
  ogLocaleAlternates: string[];
  ogImage: string;
  siteName: string;
  origin: string;
  jsonLd: unknown[];
};

export type ResolveSeoInput = {
  origin: string;
  pathname: string;
  search: string;
  schools: readonly SeoSchool[];
  catalogKnown: boolean;
  description: string | null;
  hasCover: boolean;
};

type Draft = {
  status: 200 | 404;
  lang: UiLang;
  title: string;
  description: string;
  robots: string;
  /** Path after the language prefix. Null skips hreflang and uses pathname as canonical. */
  tail: string | null;
  pathname: string;
  ogType: "website" | "article";
  imagePath: string;
  jsonLd: unknown[];
};

export function matchPath(pathname: string): RouteMatch {
  if (pathname === "/admin") return { kind: "admin" };
  const parts = pathname.split("/").filter(Boolean);
  const lang = parts[0];
  if (!isSupportedUiLang(lang)) return { kind: "notFound", lang: "en" };
  if (parts.length === 1) return { kind: "home", lang };
  if (parts.length === 2 && parts[1] in SEGMENT_KIND) {
    return { kind: SEGMENT_KIND[parts[1] as keyof typeof SEGMENT_KIND], lang };
  }
  if (parts.length === 3 && parts[1] === "schools" && isSafeSchoolIdentifier(parts[2])) {
    return { kind: "school", lang, slug: parts[2] };
  }
  return { kind: "notFound", lang };
}

/**
 * One hop to the canonical path.
 * `/` is a temporary language choice. Other fixes are permanent.
 */
export function canonicalize(
  pathname: string,
  acceptLanguage: string | undefined
): { status: 301 | 302; pathname: string } | null {
  if (pathname === "/" || pathname === "") {
    return { status: 302, pathname: `/${uiLanguageFromAcceptLanguage(acceptLanguage)}` };
  }

  let path = pathname.replace(/\/{2,}/g, "/");
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  path = path.toLowerCase();

  const first = path.split("/").filter(Boolean)[0] ?? "";
  const reserved = path === "/admin" || first === "api" || first === "health";
  if (!reserved && !isSupportedUiLang(first)) {
    const rest = path.split("/").filter(Boolean).slice(1).join("/");
    path = `/en${rest ? `/${rest}` : ""}`;
  }

  if (path !== pathname) return { status: 301, pathname: path };
  return null;
}

export function resolveSeo(input: ResolveSeoInput): SeoDocument {
  const origin = input.origin.replace(/\/+$/, "");
  const match = matchPath(input.pathname);
  if (match.kind === "admin") return finish(origin, adminDraft(input.pathname));
  if (match.kind === "notFound") return finish(origin, notFoundDraft(match.lang, input.pathname));
  if (match.kind === "school") return finish(origin, schoolDraft(input, match.lang, match.slug));
  return finish(origin, staticDraft(input, match.kind, match.lang));
}

export function robotsTxt(origin: string): string {
  const base = origin.replace(/\/+$/, "");
  return `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${base}/sitemap.xml\n`;
}

export function indexableTails(slugs: readonly string[]): string[] {
  const schoolTails = slugs.filter(isSafeSchoolIdentifier).map((slug) => `/schools/${slug}`);
  return [...STATIC_TAILS, ...schoolTails];
}

export function buildSitemap(origin: string, schools: readonly { slug: string; updatedAt: Date | string }[]): string {
  const base = origin.replace(/\/+$/, "");
  const urls = indexableTails(schools.map((school) => school.slug)).flatMap((tail) => {
    const updated = tail.startsWith("/schools/")
      ? schools.find((school) => `/schools/${school.slug}` === tail)?.updatedAt
      : undefined;
    return SUPPORTED_UI_LANGS.map((lang) => urlEntry(base, lang, tail, updated));
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`;
}

export function injectSeo(html: string, doc: SeoDocument): string {
  const withLang = html.replace(/<html lang="[^"]*">/, () => `<html lang="${escapeHtml(doc.htmlLang)}">`);
  const withTitle = withLang.replace(/<title>[^<]*<\/title>/, () => `<title>${escapeHtml(doc.title)}</title>`);
  const withDescription = withTitle.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    () => `<meta name="description" content="${escapeHtml(doc.description)}" />`
  );
  const block = renderHead(doc);
  if (withDescription.includes("<!--seo-->")) return withDescription.replace("<!--seo-->", () => block);
  return withDescription.replace("</head>", () => `${block}\n</head>`);
}

export function readSiteOrigin(): string {
  if (typeof document === "undefined") return "";
  const content = document.querySelector('meta[name="site-origin"]')?.getAttribute("content")?.trim();
  if (content) return content.replace(/\/+$/, "");
  return window.location.origin;
}

export function applySeo(doc: SeoDocument): void {
  document.querySelectorAll("[data-seo]").forEach((node) => node.remove());
  document.documentElement.lang = doc.htmlLang;
  document.title = doc.title;
  upsertMeta("name", "description", doc.description);
  const tags = renderNodes(doc);
  for (const node of tags) document.head.appendChild(node);
}

function staticDraft(input: ResolveSeoInput, kind: "home" | StaticKind, lang: UiLang): Draft {
  const filtered = kind === "catalog" && catalogFiltersActive(input.search);
  const tail = kind === "home" ? "" : kind === "catalog" ? "/schools" : `/${kind}`;
  const title = text(lang, `seo.${kind === "catalog" ? "schools" : kind}.title`);
  const description = text(lang, `seo.${kind === "catalog" ? "schools" : kind}.description`);
  const imagePath = "/og.jpg";
  const crumbs = breadcrumb(input.origin, lang, [
    { name: text(lang, "nav.home"), path: "" },
    ...(kind === "home" ? [] : [{ name: crumbName(lang, kind), path: tail }]),
  ]);
  const page = webPage(lang, title, description, absolute(input.origin, `/${lang}${tail}`));
  const jsonLd =
    kind === "home"
      ? [organization(input.origin), website(input.origin, lang, title), page]
      : kind === "catalog" && !filtered
        ? [collectionPage(input, lang, title, description), crumbs]
        : [page, crumbs];
  return {
    status: 200,
    lang,
    title,
    description,
    robots: filtered ? NOINDEX_FOLLOW : INDEX,
    tail,
    pathname: input.pathname,
    ogType: "website",
    imagePath,
    jsonLd,
  };
}

function schoolDraft(input: ResolveSeoInput, lang: UiLang, slug: string): Draft {
  const tail = `/schools/${slug}`;
  const school = input.schools.find((item) => item.slug === slug);
  if (!school && input.catalogKnown) return notFoundDraft(lang, input.pathname);
  const name = school ? localizedSchoolName(school, lang) : slug;
  const title = text(lang, "seo.school.title", { name });
  const description = schoolDescription(input.description, lang, name, school);
  const imagePath = input.hasCover ? `/schools/${slug}.jpg` : "/og.jpg";
  const canonical = absolute(input.origin, `/${lang}${tail}`);
  const jsonLd = school
    ? [
        schoolNode(input.origin, lang, school, name, description, canonical, imagePath),
        breadcrumb(input.origin, lang, [
          { name: text(lang, "nav.home"), path: "" },
          { name: text(lang, "nav.catalog"), path: "/schools" },
          { name, path: tail },
        ]),
      ]
    : [webPage(lang, title, description, canonical)];
  return {
    status: 200,
    lang,
    title,
    description,
    robots: INDEX,
    tail,
    pathname: input.pathname,
    ogType: "article",
    imagePath,
    jsonLd,
  };
}

function notFoundDraft(lang: UiLang, pathname: string): Draft {
  return {
    status: 404,
    lang,
    title: text(lang, "seo.notFound.title"),
    description: text(lang, "seo.notFound.description"),
    robots: NOINDEX,
    tail: null,
    pathname,
    ogType: "website",
    imagePath: "/og.jpg",
    jsonLd: [],
  };
}

function adminDraft(pathname: string): Draft {
  return {
    status: 200,
    lang: "ru",
    title: "Админка — GeoEduGuide",
    description: "Закрытый раздел.",
    robots: NOINDEX,
    tail: null,
    pathname,
    ogType: "website",
    imagePath: "/og.jpg",
    jsonLd: [],
  };
}

function finish(origin: string, draft: Draft): SeoDocument {
  const siteName = text(draft.lang, "seo.siteName") || "GeoEduGuide";
  const canonical = draft.tail === null ? absolute(origin, draft.pathname) : absolute(origin, `/${draft.lang}${draft.tail}`);
  const alternates = draft.tail === null ? [] : alternatesFor(origin, draft.tail);
  const ogLocale = OG_LOCALE[draft.lang];
  return {
    status: draft.status,
    htmlLang: HTML_LANG[draft.lang],
    title: draft.title,
    description: draft.description,
    robots: draft.robots,
    canonical,
    alternates,
    ogType: draft.ogType,
    ogLocale,
    ogLocaleAlternates: SUPPORTED_UI_LANGS.map((lang) => OG_LOCALE[lang]).filter((locale) => locale !== ogLocale),
    ogImage: absolute(origin, draft.imagePath),
    siteName,
    origin,
    jsonLd: withContext(draft.jsonLd),
  };
}

function alternatesFor(origin: string, tail: string): SeoAlternate[] {
  const links = SUPPORTED_UI_LANGS.map((lang) => ({
    hreflang: HREFLANG[lang],
    href: absolute(origin, `/${lang}${tail}`),
  }));
  links.push({ hreflang: "x-default", href: absolute(origin, `/en${tail}`) });
  return links;
}

function schoolDescription(description: string | null, lang: UiLang, name: string, school: SeoSchool | undefined): string {
  const provided = clip(description ?? "");
  if (provided) return provided;
  const address = school?.address?.trim() || "—";
  const languages = school ? formatInstructionLanguagesLabel(school.languages, text(lang, "map.bilingual")) : "";
  return clip(text(lang, "seo.school.fallback", { name, address, languages: languages || "—" }));
}

function organization(origin: string): Record<string, unknown> {
  return {
    "@type": "Organization",
    name: "GeoEduGuide",
    url: absolute(origin, "/en"),
  };
}

function website(origin: string, lang: UiLang, name: string): Record<string, unknown> {
  return {
    "@type": "WebSite",
    name,
    url: absolute(origin, `/${lang}`),
    inLanguage: HTML_LANG[lang],
    publisher: { "@type": "Organization", name: "GeoEduGuide" },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absolute(origin, `/${lang}/schools?q={search_term_string}`),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

function webPage(lang: UiLang, name: string, description: string, url: string): Record<string, unknown> {
  return {
    "@type": "WebPage",
    name,
    description,
    url,
    inLanguage: HTML_LANG[lang],
  };
}

function collectionPage(input: ResolveSeoInput, lang: UiLang, name: string, description: string): Record<string, unknown> {
  const url = absolute(input.origin, `/${lang}/schools`);
  const ordered = [...input.schools].sort((a, b) => a.slug.localeCompare(b.slug));
  return {
    "@type": "CollectionPage",
    name,
    description,
    url,
    inLanguage: HTML_LANG[lang],
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: ordered.length,
      itemListElement: ordered.map((school, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: localizedSchoolName(school, lang),
        url: absolute(input.origin, `/${lang}/schools/${school.slug}`),
      })),
    },
  };
}

function schoolNode(
  origin: string,
  lang: UiLang,
  school: SeoSchool,
  name: string,
  description: string,
  url: string,
  imagePath: string
): Record<string, unknown> {
  const languages = parseInstructionLanguages(school.languages)
    .map((code) => INSTRUCTION_BCP[code])
    .filter((code): code is string => Boolean(code));
  return {
    "@type": "School",
    name,
    description,
    url,
    image: absolute(origin, imagePath),
    address: {
      "@type": "PostalAddress",
      streetAddress: school.address,
      addressLocality: text(lang, "seo.place"),
      addressCountry: "GE",
    },
    ...(languages.length > 0 ? { availableLanguage: languages } : {}),
  };
}

function breadcrumb(origin: string, lang: UiLang, items: { name: string; path: string }[]): Record<string, unknown> {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absolute(origin, `/${lang}${item.path}`),
    })),
  };
}

function crumbName(lang: UiLang, kind: StaticKind): string {
  if (kind === "catalog") return text(lang, "nav.catalog");
  if (kind === "map") return text(lang, "nav.map");
  if (kind === "directory") return text(lang, "nav.directory");
  if (kind === "assistant") return text(lang, "nav.assistant");
  return text(lang, "nav.about");
}

function withContext(nodes: unknown[]): unknown[] {
  if (nodes.length === 0) return [];
  return [{ "@context": "https://schema.org", "@graph": nodes }];
}

function catalogFiltersActive(search: string): boolean {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return ["q", "district", "lang", "program", "intl"].some((key) => (params.get(key) ?? "").trim() !== "");
}

function urlEntry(origin: string, lang: UiLang, tail: string, updatedAt: Date | string | undefined): string {
  const loc = absolute(origin, `/${lang}${tail}`);
  const links = alternatesFor(origin, tail)
    .map((link) => `    <xhtml:link rel="alternate" hreflang="${xml(link.hreflang)}" href="${xml(link.href)}" />`)
    .join("\n");
  const modified = lastmod(updatedAt);
  const last = modified ? `    <lastmod>${modified}</lastmod>\n` : "";
  return `  <url>\n    <loc>${xml(loc)}</loc>\n${last}${links}\n  </url>`;
}

function lastmod(value: Date | string | undefined): string | null {
  if (!value) return null;
  const time = value instanceof Date ? value.getTime() : Date.parse(value);
  if (!Number.isFinite(time)) return null;
  return new Date(time).toISOString().slice(0, 10);
}

function renderHead(doc: SeoDocument): string {
  const lines = [
    meta("name", "robots", doc.robots),
    meta("name", "site-origin", doc.origin),
    `<link rel="canonical" href="${escapeHtml(doc.canonical)}" data-seo="1" />`,
    ...doc.alternates.map(
      (link) => `<link rel="alternate" hreflang="${escapeHtml(link.hreflang)}" href="${escapeHtml(link.href)}" data-seo="1" />`
    ),
    meta("property", "og:title", doc.title),
    meta("property", "og:description", doc.description),
    meta("property", "og:url", doc.canonical),
    meta("property", "og:type", doc.ogType),
    meta("property", "og:locale", doc.ogLocale),
    ...doc.ogLocaleAlternates.map((locale) => meta("property", "og:locale:alternate", locale)),
    meta("property", "og:image", doc.ogImage),
    meta("property", "og:site_name", doc.siteName),
    meta("name", "twitter:card", "summary_large_image"),
    meta("name", "twitter:title", doc.title),
    meta("name", "twitter:description", doc.description),
    meta("name", "twitter:image", doc.ogImage),
  ];
  if (doc.jsonLd.length > 0) {
    lines.push(`<script type="application/ld+json" data-seo="1">${jsonForHtml(doc.jsonLd)}</script>`);
  }
  return lines.join("\n    ");
}

function renderNodes(doc: SeoDocument): Node[] {
  const nodes: Node[] = [];
  nodes.push(metaNode("name", "robots", doc.robots));
  nodes.push(metaNode("name", "site-origin", doc.origin));
  nodes.push(linkNode("canonical", doc.canonical));
  for (const alternate of doc.alternates) nodes.push(linkNode("alternate", alternate.href, alternate.hreflang));
  nodes.push(metaNode("property", "og:title", doc.title));
  nodes.push(metaNode("property", "og:description", doc.description));
  nodes.push(metaNode("property", "og:url", doc.canonical));
  nodes.push(metaNode("property", "og:type", doc.ogType));
  nodes.push(metaNode("property", "og:locale", doc.ogLocale));
  for (const locale of doc.ogLocaleAlternates) nodes.push(metaNode("property", "og:locale:alternate", locale));
  nodes.push(metaNode("property", "og:image", doc.ogImage));
  nodes.push(metaNode("property", "og:site_name", doc.siteName));
  nodes.push(metaNode("name", "twitter:card", "summary_large_image"));
  nodes.push(metaNode("name", "twitter:title", doc.title));
  nodes.push(metaNode("name", "twitter:description", doc.description));
  nodes.push(metaNode("name", "twitter:image", doc.ogImage));
  if (doc.jsonLd.length > 0) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-seo", "1");
    script.textContent = jsonForHtml(doc.jsonLd);
    nodes.push(script);
  }
  return nodes;
}

function meta(attr: "name" | "property", key: string, content: string): string {
  return `<meta ${attr}="${escapeHtml(key)}" content="${escapeHtml(content)}" data-seo="1" />`;
}

function metaNode(attr: "name" | "property", key: string, content: string): HTMLMetaElement {
  const node = document.createElement("meta");
  node.setAttribute(attr, key);
  node.setAttribute("content", content);
  node.setAttribute("data-seo", "1");
  return node;
}

function linkNode(rel: string, href: string, hreflang?: string): HTMLLinkElement {
  const node = document.createElement("link");
  node.rel = rel;
  node.href = href;
  if (hreflang) node.hreflang = hreflang;
  node.setAttribute("data-seo", "1");
  return node;
}

function upsertMeta(attr: "name" | "property", key: string, content: string): void {
  let node = document.head.querySelector(`meta[${attr}="${CSS.escape(key)}"]`);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attr, key);
    node.setAttribute("data-seo", "1");
    document.head.appendChild(node);
  }
  node.setAttribute("content", content);
}

function text(lang: UiLang, key: string, options?: Record<string, string>): string {
  const value = i18n.t(key, { lng: lang, ...options });
  return typeof value === "string" ? value : "";
}

function absolute(origin: string, pathname: string): string {
  const base = origin.replace(/\/+$/, "");
  return `${base}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

function clip(value: string, max = 160): string {
  const clean = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const chars = Array.from(clean);
  if (chars.length === 0 || chars.length <= max) return clean;
  const cut = chars.slice(0, max - 1).join("");
  const space = cut.lastIndexOf(" ");
  const base = (space > 80 ? cut.slice(0, space) : cut).replace(/[.,;:!?…-]+$/u, "");
  return `${base}…`;
}

function xml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function jsonForHtml(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
