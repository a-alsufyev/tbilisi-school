import { useOutletContext, useParams } from "react-router-dom";
import LoadError from "../components/LoadError";
import Hero from "../components/home/Hero";
import Chapters from "../components/home/Chapters";
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
  const { schools, config, loadError } = useOutletContext<OutletData>();
  const prefix = `/${lang ?? "en"}`;

  if (loadError && schools.length === 0) {
    return <LoadError />;
  }

  return (
    <div className="bg-gray-50">
      <Hero prefix={prefix} lang={lang ?? "en"} schools={schools} />
      <Chapters schools={schools} prefix={prefix} />
      <Stats schools={schools} />
      <QuickFilters schools={schools} prefix={prefix} />
      <MapSection schools={schools} apiKey={config?.yandexMapsApiKey || ""} prefix={prefix} />
      <Districts schools={schools} prefix={prefix} />
      <Collections schools={schools} prefix={prefix} />
      <AssistantTeaser prefix={prefix} />
      <FeaturedSchools schools={schools} prefix={prefix} />
    </div>
  );
}
