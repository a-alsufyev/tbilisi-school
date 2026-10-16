import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SchoolCard from "../SchoolCard";
import { confirmedInternationalStatuses } from "../../lib/lookups";
import type { School } from "../../types";

export default function FeaturedSchools({ schools, prefix }: { schools: School[]; prefix: string }) {
  const { t } = useTranslation();
  const featured = useMemo(
    () =>
      [...schools]
        .sort(
          (a, b) =>
            confirmedInternationalStatuses(b.internationalStatuses).length -
            confirmedInternationalStatuses(a.internationalStatuses).length
        )
        .slice(0, 6),
    [schools]
  );

  if (featured.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-end justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t("home.featuredTitle")}</h2>
        <Link to={`${prefix}/schools`} className="text-indigo-600 font-semibold hover:underline">
          {t("home.allSchools")} →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {featured.map((school) => (
          <SchoolCard key={school.id} school={school} prefix={prefix} />
        ))}
      </div>
    </section>
  );
}
