import { useOutletContext, useParams } from "react-router-dom";
import Catalog from "../components/Catalog";
import LoadError from "../components/LoadError";
import NotFound from "../components/NotFound";
import type { Config, School } from "../types";

type OutletData = {
  schools: School[];
  config: Config | null;
  loadError: boolean;
};

export default function SchoolPage() {
  const { slug } = useParams();
  const { schools, config, loadError } = useOutletContext<OutletData>();

  if (loadError && schools.length === 0) {
    return <LoadError />;
  }

  const school = schools.find((item) => item.slug === slug);
  if (!school) {
    return <NotFound titleKey="catalog.notFound" />;
  }

  return (
    <Catalog schools={schools} apiKey={config?.yandexMapsApiKey || ""} selectedSchool={school} />
  );
}
