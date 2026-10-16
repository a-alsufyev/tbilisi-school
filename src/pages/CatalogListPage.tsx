import { useMemo } from "react";
import { Link, useLocation, useOutletContext, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import Catalog from "../components/Catalog";
import LoadError from "../components/LoadError";
import { filterCatalog, hasCatalogQuery, readCatalogQuery } from "../lib/home";
import type { Config, School } from "../types";

type OutletData = {
  schools: School[];
  config: Config | null;
  loadError: boolean;
};

export default function CatalogListPage() {
  const { schools, config, loadError } = useOutletContext<OutletData>();
  const { t } = useTranslation();
  const { lang } = useParams();
  const location = useLocation();
  const query = useMemo(() => readCatalogQuery(location.search), [location.search]);
  const filtered = useMemo(() => filterCatalog(schools, query), [schools, query]);

  if (loadError && schools.length === 0) {
    return <LoadError />;
  }

  const active = hasCatalogQuery(query);
  const chips = [
    query.q ? `“${query.q}”` : "",
    query.district ? t(`assistant.districts.${query.district}`) : "",
    query.lang,
    query.program,
    query.intl ? t("home.collections.international") : "",
  ].filter(Boolean);

  return (
    <>
      {active && (
        <div className="max-w-7xl mx-auto px-4 pt-6 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-gray-500">{t("home.filtersApplied", { count: filtered.length })}</span>
          {chips.map((chip) => (
            <span key={chip} className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">
              {chip}
            </span>
          ))}
          <Link
            to={`/${lang ?? "en"}/schools`}
            className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
            {t("home.resetFilters")}
          </Link>
        </div>
      )}
      <Catalog schools={filtered} apiKey={config?.yandexMapsApiKey || ""} selectedSchool={null} />
    </>
  );
}
