import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MapView from "../components/Map";
import LoadError from "../components/LoadError";
import type { Config, School } from "../types";

type OutletData = {
  schools: School[];
  config: Config | null;
  loadError: boolean;
};

export default function MapPage() {
  const { t } = useTranslation();
  const { lang } = useParams();
  const navigate = useNavigate();
  const { schools, config, loadError } = useOutletContext<OutletData>();

  if (loadError && schools.length === 0) {
    return <LoadError />;
  }

  return (
    <div className="flex flex-col items-center bg-gray-50 pb-12">
      <div className="w-[85%] lg:w-[80%] mx-auto px-4 pt-8 pb-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">{t("seo.map.h1")}</h1>
      </div>
      <div className="w-[85%] lg:w-[80%] mx-auto shadow-2xl rounded-2xl overflow-hidden">
        <MapView
          schools={schools}
          apiKey={config?.yandexMapsApiKey || ""}
          onSchoolSelect={(school) => navigate(`/${lang}/schools/${school.slug}?from=map`)}
        />
      </div>
    </div>
  );
}
