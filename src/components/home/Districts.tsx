import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CoverImage from "../CoverImage";
import { DISTRICT_IDS } from "../../lib/districts";
import { districtPhotoUrl, schoolDistrictId } from "../../lib/cover";
import { catalogHref } from "../../lib/home";
import type { School } from "../../types";

export default function Districts({ schools, prefix }: { schools: School[]; prefix: string }) {
  const { t } = useTranslation();

  const tiles = useMemo(() => {
    const counts = new Map<string, number>();
    for (const school of schools) {
      const id = schoolDistrictId(school);
      if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return DISTRICT_IDS.map((id) => ({ id, count: counts.get(id) ?? 0 }))
      .filter((tile) => tile.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [schools]);

  if (tiles.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-2xl font-bold text-gray-900">{t("home.districtsTitle")}</h2>
      <p className="text-gray-500 mt-1 mb-6">{t("home.districtsText")}</p>
      <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[9rem] gap-4">
        {tiles.map((tile, index) => (
          <Link
            key={tile.id}
            to={catalogHref(prefix, { district: tile.id })}
            className={`group rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow ${
              index === 0 ? "col-span-2 row-span-2" : ""
            }`}
          >
            <CoverImage
              seed={`district:${tile.id}`}
              photos={[districtPhotoUrl(tile.id)]}
              initials={t(`assistant.districts.${tile.id}`).slice(0, 1)}
              className="h-full group-hover:brightness-110 transition-[filter]"
            >
              <div className="absolute inset-x-0 bottom-0 p-4">
                <h3 className={`font-bold drop-shadow-sm ${index === 0 ? "text-2xl" : "text-lg"}`}>
                  {t(`assistant.districts.${tile.id}`)}
                </h3>
                <p className="text-sm text-white/85">{t("home.schoolsCount", { count: tile.count })}</p>
              </div>
            </CoverImage>
          </Link>
        ))}
      </div>
    </section>
  );
}
