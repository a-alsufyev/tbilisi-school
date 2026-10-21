import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Award, BookOpen, Languages } from "lucide-react";
import { catalogHref, countWhere, type CatalogQuery } from "../../lib/home";
import type { School } from "../../types";

type Item = {
  key: string;
  query: Partial<CatalogQuery>;
  icon: typeof Award;
  tone: string;
};

const ITEMS: Item[] = [
  { key: "international", query: { intl: true }, icon: Award, tone: "bg-amber-50 text-amber-600" },
  { key: "english", query: { lang: "EN" }, icon: Languages, tone: "bg-sky-50 text-sky-600" },
  { key: "russian", query: { lang: "RU" }, icon: Languages, tone: "bg-emerald-50 text-emerald-600" },
  { key: "georgian", query: { lang: "GE" }, icon: BookOpen, tone: "bg-purple-50 text-purple-600" },
];

export default function Collections({ schools, prefix }: { schools: School[]; prefix: string }) {
  const { t } = useTranslation();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-2xl font-bold text-gray-900">{t("home.collectionsTitle")}</h2>
      <p className="text-sm text-gray-500 mt-1 mb-6">{t("home.place")}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ITEMS.map(({ key, query, icon: Icon, tone }) => (
          <Link
            key={key}
            to={catalogHref(prefix, query)}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className={`inline-flex p-3 rounded-lg ${tone}`}>
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">{t(`home.collections.${key}`)}</h3>
            <p className="text-sm text-gray-500">{t("home.schoolsCount", { count: countWhere(schools, query) })}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
