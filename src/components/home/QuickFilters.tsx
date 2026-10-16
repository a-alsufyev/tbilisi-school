import { useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { catalogHref, topPrograms } from "../../lib/home";
import type { School } from "../../types";

const LANGS = [
  { code: "EN", key: "en" },
  { code: "RU", key: "ru" },
  { code: "GE", key: "ge" },
  { code: "DE", key: "de" },
] as const;

const chip =
  "px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition-colors whitespace-nowrap";

export default function QuickFilters({ schools, prefix }: { schools: School[]; prefix: string }) {
  const { t } = useTranslation();
  const programs = useMemo(() => topPrograms(schools, 6), [schools]);

  const group = (title: string, children: ReactNode) => (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-5">
      {group(
        t("home.byLanguage"),
        LANGS.map((item) => (
          <Link key={item.code} to={catalogHref(prefix, { lang: item.code })} className={chip}>
            {t(`home.languages.${item.key}`)}
          </Link>
        ))
      )}
      {programs.length > 0 &&
        group(
          t("home.byProgram"),
          programs.map((program) => (
            <Link key={program} to={catalogHref(prefix, { program })} className={chip}>
              {program}
            </Link>
          ))
        )}
    </section>
  );
}
