import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SCHEME_HEIGHT, SCHEME_RINGS, SCHEME_WIDTH, projectToScheme } from "../../lib/city-scheme";
import { parseCoordinates } from "../../lib/school-filters";
import { catalogHref } from "../../lib/home";
import type { School } from "../../types";

/** Decorative-but-useful scheme of Tbilisi: districts are links, dots are schools. */
export default function CityScheme({ schools, prefix }: { schools: School[]; prefix: string }) {
  const { t } = useTranslation();
  const dots = useMemo(
    () =>
      schools.flatMap((school) => {
        const point = parseCoordinates(school.coordinates);
        if (!point) return [];
        const [x, y] = projectToScheme(point.lat, point.lng);
        return [{ id: school.id, x, y }];
      }),
    [schools]
  );

  return (
    <div className="relative rounded-3xl bg-white/70 backdrop-blur border border-white shadow-xl shadow-indigo-100 p-5">
      <svg
        viewBox={`0 0 ${SCHEME_WIDTH} ${SCHEME_HEIGHT}`}
        className="w-full h-auto"
        role="group"
        aria-label={t("home.districtsTitle")}
      >
        {SCHEME_RINGS.map((ring) => (
          <Link key={ring.id} to={catalogHref(prefix, { district: ring.id })}>
            <title>{t(`assistant.districts.${ring.id}`)}</title>
            <polygon
              points={ring.points}
              strokeWidth={1}
              strokeLinejoin="round"
              className="fill-indigo-50 stroke-indigo-200 hover:fill-indigo-200 hover:stroke-indigo-400 transition-colors cursor-pointer"
            />
          </Link>
        ))}
        {dots.map((dot, index) => (
          <g key={dot.id} transform={`translate(${dot.x.toFixed(1)} ${dot.y.toFixed(1)})`} className="pointer-events-none">
            {index % 4 === 0 && <circle r="6" className="fill-indigo-500/20 animate-pulse" />}
            <circle r="2.6" className="fill-indigo-600 stroke-white" strokeWidth="1" />
          </g>
        ))}
      </svg>
      <p className="mt-3 text-center text-sm text-gray-500">
        {t("home.schoolsCount", { count: schools.length })} · {t("home.schemeHint")}
      </p>
    </div>
  );
}
