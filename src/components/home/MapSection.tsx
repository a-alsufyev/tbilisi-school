import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MapView from "../Map";
import type { School } from "../../types";

type MapSectionProps = {
  schools: School[];
  apiKey: string;
  prefix: string;
};

export default function MapSection({ schools, apiKey, prefix }: MapSectionProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const holder = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = holder.current;
    if (!node || visible) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-end justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t("home.mapTitle")}</h2>
        <Link to={`${prefix}/map`} className="text-indigo-600 font-semibold hover:underline">
          {t("home.openFullMap")} →
        </Link>
      </div>
      <div ref={holder} className="rounded-2xl overflow-hidden shadow-xl border border-gray-100 bg-white min-h-[420px]">
        {visible && (
          <MapView
            schools={schools}
            apiKey={apiKey}
            height="420px"
            onSchoolSelect={(school) => navigate(`${prefix}/schools/${school.slug}?from=map`)}
          />
        )}
      </div>
    </section>
  );
}
