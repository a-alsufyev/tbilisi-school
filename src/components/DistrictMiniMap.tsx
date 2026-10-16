import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { districtAt } from "../lib/districts";
import { SCHEME_HEIGHT, SCHEME_RINGS, SCHEME_WIDTH, projectToScheme } from "../lib/city-scheme";
import { parseCoordinates } from "../lib/school-filters";
import type { School } from "../types";

/** Schematic of Tbilisi districts with the school's district highlighted and the school marked. */
export default function DistrictMiniMap({ school }: { school: School }) {
  const { t } = useTranslation();
  const point = useMemo(() => parseCoordinates(school.coordinates), [school.coordinates]);
  const districtId = point ? districtAt(point.lat, point.lng) : null;
  const marker = point ? projectToScheme(point.lat, point.lng) : null;

  return (
    <figure className="rounded-xl bg-slate-50 border border-gray-200 p-3">
      <svg viewBox={`0 0 ${SCHEME_WIDTH} ${SCHEME_HEIGHT}`} className="w-full h-auto" role="img" aria-label={school.name}>
        {SCHEME_RINGS.map((ring) => (
          <polygon
            key={ring.id}
            points={ring.points}
            className={ring.id === districtId ? "fill-indigo-200 stroke-indigo-500" : "fill-white stroke-slate-300"}
            strokeWidth={ring.id === districtId ? 1.5 : 1}
            strokeLinejoin="round"
          />
        ))}
        {marker && (
          <g transform={`translate(${marker[0]} ${marker[1]})`}>
            <circle r="9" className="fill-rose-500/25" />
            <circle r="4.5" className="fill-rose-500 stroke-white" strokeWidth="1.5" />
          </g>
        )}
      </svg>
      {districtId && (
        <figcaption className="mt-2 text-sm font-medium text-gray-700 text-center">
          {t(`assistant.districts.${districtId}`)}
        </figcaption>
      )}
    </figure>
  );
}
