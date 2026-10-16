import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CreditCard, MapPin } from "lucide-react";
import type { School } from "../types";
import { localeSchoolName, primarySchoolName } from "../hooks/useSchoolTranslations";
import { costStatusOf, formatCostAmount, formatCostStatusText } from "../lib/cost";
import { initialsOf, schoolDistrictId, schoolPhotos } from "../lib/cover";
import CoverImage from "./CoverImage";
import SchoolBadges from "./SchoolBadges";

type SchoolCardProps = {
  school: School;
  prefix: string;
  from?: string;
};

export default function SchoolCard({ school, prefix, from = "catalog" }: SchoolCardProps) {
  const { t, i18n } = useTranslation();
  const primaryName = primarySchoolName(school);
  const localName = localeSchoolName(school, i18n.language);
  const districtId = schoolDistrictId(school);
  const periodLabels = { month: t("catalog.perMonth"), year: t("catalog.perYear") };
  const boundLabels = { from: t("catalog.costFrom"), to: t("catalog.costTo") };
  const amount = formatCostAmount(school, periodLabels, boundLabels);
  const phrase = formatCostStatusText(
    school,
    {
      official: t("catalog.costOfficial"),
      approximate: t("catalog.costApproximate"),
      unknown: t("catalog.costUnknown"),
    },
    (status, year) => t("catalog.costStatusYear", { status, year })
  );

  return (
    <Link
      to={`${prefix}/schools/${school.slug}?from=${from}`}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all group flex flex-col h-full"
    >
      <CoverImage
        seed={school.slug}
        photos={schoolPhotos(school)}
        initials={initialsOf(primaryName)}
        className="h-32 shrink-0"
      >
        {districtId && (
          <span className="absolute left-3 top-3 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm text-xs font-medium">
            {t(`assistant.districts.${districtId}`)}
          </span>
        )}
      </CoverImage>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors leading-snug">
          {primaryName}
        </h3>
        {localName && <p className="text-sm text-gray-500 font-medium">{localName}</p>}

        <SchoolBadges school={school} className="mt-3" />

        <div className="mt-4 space-y-2 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{school.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 flex-shrink-0" />
            <span>
              {costStatusOf(school) === "unknown"
                ? t("catalog.costUnknown")
                : amount
                  ? `${amount} · ${phrase}`
                  : phrase}
            </span>
          </div>
        </div>

        <div className="mt-auto pt-4 flex justify-end">
          <span className="text-indigo-600 text-sm font-semibold group-hover:underline">
            {t("catalog.viewDetails")} →
          </span>
        </div>
      </div>
    </Link>
  );
}
