import { Link, useOutletContext, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookMarked, Info } from "lucide-react";
import LoadError from "../components/LoadError";
import Hero from "../components/home/Hero";
import QuickFilters from "../components/home/QuickFilters";
import Stats from "../components/home/Stats";
import MapSection from "../components/home/MapSection";
import Districts from "../components/home/Districts";
import Collections from "../components/home/Collections";
import AssistantTeaser from "../components/home/AssistantTeaser";
import FeaturedSchools from "../components/home/FeaturedSchools";
import type { Config, School } from "../types";

type OutletData = {
  schools: School[];
  config: Config | null;
  loadError: boolean;
};

export default function HomePage() {
  const { lang } = useParams();
  const { t } = useTranslation();
  const { schools, config, loadError } = useOutletContext<OutletData>();
  const prefix = `/${lang ?? "en"}`;

  if (loadError && schools.length === 0) {
    return <LoadError />;
  }

  const tiles = [
    { to: `${prefix}/directory`, icon: BookMarked, title: t("nav.directory"), text: t("home.directoryText") },
    { to: `${prefix}/about`, icon: Info, title: t("nav.about"), text: t("home.aboutText") },
  ];

  return (
    <div className="bg-gray-50">
      <Hero prefix={prefix} lang={lang ?? "en"} schools={schools} />
      <Stats schools={schools} />
      <QuickFilters schools={schools} prefix={prefix} />
      <MapSection schools={schools} apiKey={config?.yandexMapsApiKey || ""} prefix={prefix} />
      <Districts schools={schools} prefix={prefix} />
      <Collections schools={schools} prefix={prefix} />
      <AssistantTeaser prefix={prefix} />
      <FeaturedSchools schools={schools} prefix={prefix} />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid sm:grid-cols-2 gap-4">
        {tiles.map(({ to, icon: Icon, title, text }) => (
          <Link
            key={to}
            to={to}
            className="flex items-start gap-4 bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500 mt-1">{text}</p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
