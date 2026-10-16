import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { computeStats } from "../../lib/home";
import type { School } from "../../types";

export default function Stats({ schools }: { schools: School[] }) {
  const { t } = useTranslation();
  const stats = useMemo(() => computeStats(schools), [schools]);
  const items = [
    { value: stats.schools, label: t("home.stats.schools") },
    { value: stats.languages, label: t("home.stats.languages") },
    { value: stats.programs, label: t("home.stats.programs") },
    { value: stats.priced, label: t("home.stats.priced") },
  ];

  return (
    <section className="bg-white border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {items.map((item) => (
          <div key={item.label}>
            <div className="text-3xl sm:text-4xl font-bold text-indigo-600">{item.value}</div>
            <div className="mt-1 text-sm text-gray-500">{item.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
