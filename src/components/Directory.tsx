import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Award, BookMarked, Globe, GraduationCap, Search } from "lucide-react";
import CoverImage from "./CoverImage";
import { directoryArticle } from "../content/directory";
import { initialsOf } from "../lib/cover";
import { catalogHref } from "../lib/home";
import { LOOKUP_KINDS, type LookupKind } from "../lib/lookups";
import { normalizeUiLanguage } from "../lib/schools";

type DirectoryItem = { label: string };
type DirectoryPayload = Record<LookupKind, DirectoryItem[]>;
type KindFilter = LookupKind | "all";

const SECTION_ICON = {
  program: GraduationCap,
  international_status: Globe,
  accreditation: Award,
} as const;

function isDirectoryPayload(value: unknown): value is DirectoryPayload {
  if (!value || typeof value !== "object") return false;
  const body = value as Record<string, unknown>;
  return LOOKUP_KINDS.every((kind) => {
    const list = body[kind];
    return (
      Array.isArray(list) &&
      list.every((item) => {
        if (!item || typeof item !== "object") return false;
        const label = (item as { label?: unknown }).label;
        return typeof label === "string" && label.trim().length > 0;
      })
    );
  });
}

function compareLocale(language: string): string {
  const locale = normalizeUiLanguage(language);
  return locale === "ge" ? "ka" : locale;
}

const chip =
  "px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap";

export default function Directory() {
  const { t, i18n } = useTranslation();
  const { lang } = useParams();
  const prefix = `/${lang ?? "en"}`;
  const [data, setData] = useState<DirectoryPayload | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/directory");
        if (!response.ok) throw new Error("load failed");
        const body: unknown = await response.json();
        if (!isDirectoryPayload(body)) throw new Error("invalid payload");
        if (!cancelled) setData(body);
      } catch {
        if (!cancelled) setError(true);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const locale = normalizeUiLanguage(i18n.language);
  const needle = query.trim().toLowerCase();

  const sections = useMemo(() => {
    if (!data) return [];
    return LOOKUP_KINDS.flatMap((kind) => {
      if (kindFilter !== "all" && kindFilter !== kind) return [];
      const items = [...data[kind]]
        .sort((left, right) => {
          const leftMarker = directoryArticle(kind, left.label)?.marker ? 1 : 0;
          const rightMarker = directoryArticle(kind, right.label)?.marker ? 1 : 0;
          if (leftMarker !== rightMarker) return leftMarker - rightMarker;
          return left.label.localeCompare(right.label, compareLocale(i18n.language));
        })
        .filter((item) => {
          if (!needle) return true;
          const article = directoryArticle(kind, item.label);
          const text = `${item.label} ${article?.text[locale] ?? ""}`.toLowerCase();
          return text.includes(needle);
        });
      return items.length > 0 ? [{ kind, items }] : [];
    });
  }, [data, kindFilter, i18n.language, locale, needle]);

  const counts = useMemo(() => {
    const byKind = Object.fromEntries(LOOKUP_KINDS.map((kind) => [kind, data?.[kind].length ?? 0])) as Record<
      LookupKind,
      number
    >;
    return { all: LOOKUP_KINDS.reduce((sum, kind) => sum + byKind[kind], 0), ...byKind };
  }, [data]);

  const filters: { id: KindFilter; label: string }[] = [
    { id: "all", label: t("directory.all") },
    ...LOOKUP_KINDS.map((kind) => ({ id: kind, label: t(`directory.sections.${kind}`) })),
  ];

  return (
    <div className="bg-gray-50">
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-gray-50">
        <div aria-hidden className="absolute -top-32 -left-24 w-96 h-96 rounded-full bg-indigo-200/40 blur-3xl" />
        <div aria-hidden className="absolute top-8 right-0 w-72 h-72 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-indigo-100 text-sm font-medium text-indigo-700 shadow-sm">
            <BookMarked className="w-4 h-4" />
            {t("nav.directory")}
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
            {t("directory.title")}
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl">{t("directory.content")}</p>
        </div>
      </section>

      <div className="sticky top-16 z-40 border-b border-gray-200 bg-gray-50/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">
          <div className="flex items-center gap-2 p-2 rounded-2xl bg-white border border-gray-200 shadow-sm focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100 transition max-w-xl">
            <Search className="w-5 h-5 text-gray-400 ml-2 shrink-0" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("directory.searchPlaceholder")}
              aria-label={t("directory.searchPlaceholder")}
              className="flex-1 min-w-0 py-2 bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((filter) => {
              const active = kindFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setKindFilter(filter.id)}
                  className={`${chip} ${
                    active
                      ? "bg-indigo-600 text-white"
                      : "bg-white border border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-700"
                  }`}
                >
                  {filter.label}
                  <span className={`ml-1.5 ${active ? "text-indigo-200" : "text-gray-400"}`}>{counts[filter.id]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14">
        {error ? <p className="text-gray-700">{t("directory.loadError")}</p> : null}
        {!error && !data ? (
          <>
            <p className="sr-only">{t("directory.loading")}</p>
            <DirectorySkeleton />
          </>
        ) : null}
        {!error && data && counts.all === 0 ? <p className="text-gray-700">{t("directory.empty")}</p> : null}
        {!error && data && counts.all > 0 && sections.length === 0 ? (
          <p className="text-gray-600">{t("directory.noMatches")}</p>
        ) : null}

        {sections.map((section) => {
          const Icon = SECTION_ICON[section.kind];
          const articles = section.items.filter((item) => !directoryArticle(section.kind, item.label)?.marker);
          const notes = section.items.filter((item) => directoryArticle(section.kind, item.label)?.marker);
          return (
            <section key={section.kind} id={section.kind} className="scroll-mt-40">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{t(`directory.sections.${section.kind}`)}</h2>
              </div>
              <p className="text-gray-500 mb-6">{t(`directory.hints.${section.kind}`)}</p>

              {articles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {articles.map((item) => (
                    <article
                      key={`${section.kind}:${item.label}`}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                    >
                      <CoverImage
                        seed={`${section.kind}:${item.label}`}
                        initials={initialsOf(item.label)}
                        className="h-28 shrink-0"
                      >
                        <span className="absolute left-3 top-3 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm text-xs font-medium">
                          {t(`directory.sections.${section.kind}`)}
                        </span>
                      </CoverImage>
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="text-lg font-bold text-gray-900 leading-snug">{item.label}</h3>
                        <p className="mt-2 text-sm text-gray-600 leading-relaxed flex-1">
                          {directoryArticle(section.kind, item.label)?.text[locale] ?? t("directory.pending")}
                        </p>
                        {section.kind === "program" ? (
                          <Link
                            to={catalogHref(prefix, { program: item.label })}
                            className="mt-4 text-indigo-600 text-sm font-semibold hover:underline self-end"
                          >
                            {t("directory.seeSchools")} →
                          </Link>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}

              {notes.length > 0 ? (
                <div className={articles.length > 0 ? "mt-8" : ""}>
                  <h3 className="text-sm font-semibold text-gray-500 mb-3">{t("directory.notes")}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {notes.map((item) => (
                      <article
                        key={`${section.kind}:${item.label}`}
                        className="rounded-2xl border border-dashed border-gray-300 bg-white/60 p-5"
                      >
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          {t("directory.note")}
                        </span>
                        <h3 className="mt-2 font-semibold text-gray-800">{item.label}</h3>
                        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                          {directoryArticle(section.kind, item.label)?.text[locale] ?? t("directory.pending")}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function DirectorySkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" aria-hidden>
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="h-28 bg-gray-200 animate-pulse" />
          <div className="p-5 space-y-3">
            <div className="h-5 w-2/3 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-3 w-5/6 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
