import { useOutletContext } from "react-router-dom";
import Catalog from "../components/Catalog";
import LoadError from "../components/LoadError";
import type { Config, School } from "../types";

type OutletData = {
  schools: School[];
  config: Config | null;
  loadError: boolean;
};

export default function CatalogListPage() {
  const { schools, config, loadError } = useOutletContext<OutletData>();

  if (loadError && schools.length === 0) {
    return <LoadError />;
  }

  return <Catalog schools={schools} apiKey={config?.yandexMapsApiKey || ""} selectedSchool={null} />;
}
