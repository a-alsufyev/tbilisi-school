import React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { School } from "../types";
import { ArrowLeft, MapPin, Languages, CreditCard, BookOpen, MessageSquare, Loader2, Globe } from "lucide-react";
import { externalHref } from "../lib/website";
import { localeSchoolName, primarySchoolName } from "../hooks/useSchoolTranslations";
import { formatInstructionLanguagesLabel } from "../admin/languages";
import { joinLookupLabels } from "../lib/lookups";
import { costStatusOf, formatCostAmount, formatCostStatusText } from "../lib/cost";
import { normalizeUiLanguage, schoolReturnTo } from "../lib/schools";
import MapView from "./Map";
import SchoolCard from "./SchoolCard";
import CoverImage from "./CoverImage";
import SchoolBadges from "./SchoolBadges";
import DistrictMiniMap from "./DistrictMiniMap";
import { initialsOf, schoolPhotos } from "../lib/cover";

interface CatalogProps {
  schools: School[];
  apiKey: string;
  selectedSchool: School | null;
}

const Catalog: React.FC<CatalogProps> = ({ schools, apiKey, selectedSchool }) => {
  const { t, i18n } = useTranslation();
  const languageLabel = (value: string) => formatInstructionLanguagesLabel(value, t("map.bilingual"));
  const costPhrase = (school: School) =>
    formatCostStatusText(
      school,
      {
        official: t("catalog.costOfficial"),
        approximate: t("catalog.costApproximate"),
        unknown: t("catalog.costUnknown"),
      },
      (status, year) => t("catalog.costStatusYear", { status, year })
    );
  const periodLabels = { month: t("catalog.perMonth"), year: t("catalog.perYear") };
  const boundLabels = { from: t("catalog.costFrom"), to: t("catalog.costTo") };
  const costAmount = (school: School) => formatCostAmount(school, periodLabels, boundLabels);
  const { lang } = useParams();
  const location = useLocation();
  const [description, setDescription] = React.useState<string | null>(null);
  const [isLoadingDescription, setIsLoadingDescription] = React.useState(false);
  const prefix = `/${lang ?? "en"}`;

  React.useEffect(() => {
    if (selectedSchool) {
      setIsLoadingDescription(true);
      const identifier = selectedSchool.slug;
      const locale = encodeURIComponent(normalizeUiLanguage(i18n.language));
      fetch(`/api/schools/${encodeURIComponent(identifier)}/description?locale=${locale}`)
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch description: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          setDescription(data.description !== undefined ? data.description : null);
          setIsLoadingDescription(false);
        })
        .catch((err) => {
          console.error("Error fetching description:", err);
          setDescription(selectedSchool.comment || null);
          setIsLoadingDescription(false);
        });
    } else {
      setDescription(null);
    }
  }, [selectedSchool, i18n.language]);

  const getPrimaryName = (school: School) => primarySchoolName(school);
  const getLocaleName = (school: School) => localeSchoolName(school, i18n.language);

  const returnTo = schoolReturnTo(location.search);
  const backHref =
    returnTo === "map" ? `${prefix}/map` : returnTo === "assistant" ? `${prefix}/assistant` : `${prefix}/schools`;
  const backLabel =
    returnTo === "map"
      ? t("catalog.backMap")
      : returnTo === "assistant"
        ? t("catalog.backAssistant")
        : t("catalog.backCatalog");

  if (selectedSchool) {
    const primaryName = getPrimaryName(selectedSchool);
    const localName = getLocaleName(selectedSchool);

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <Link
              to={backHref}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {backLabel}
            </Link>
            {isLoadingDescription && (
              <div className="flex items-center gap-2 text-gray-400 text-xs italic">
                <Loader2 className="w-3 h-3 animate-spin" />
                {t("catalog.loadingDescription")}
              </div>
            )}
          </div>

          <CoverImage
            seed={selectedSchool.slug}
            photos={schoolPhotos(selectedSchool)}
            initials={initialsOf(primaryName)}
            className="h-52 sm:h-60"
          >
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <h2 className="text-3xl font-bold drop-shadow-sm">{primaryName}</h2>
              {localName && <p className="text-lg text-white/85 mt-1 font-medium">{localName}</p>}
              <SchoolBadges school={selectedSchool} maxPrograms={4} className="mt-3" />
            </div>
          </CoverImage>

          <div className="p-8">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                      {t("map.address")}
                    </h4>
                    <p className="text-lg text-gray-900">{selectedSchool.address}</p>
                  </div>
                </div>

                {selectedSchool.website && externalHref(selectedSchool.website) && (
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-sky-50 rounded-lg text-sky-600">
                      <Globe className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                        {t("catalog.website")}
                      </h4>
                      <a
                        href={externalHref(selectedSchool.website) ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg text-indigo-600 hover:underline break-all"
                      >
                        {selectedSchool.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="space-y-4">
                    {(
                      [
                        ["catalog.program", selectedSchool.programs],
                        ["catalog.internationalStatus", selectedSchool.internationalStatuses],
                        ["catalog.accreditation", selectedSchool.accreditations],
                      ] as const
                    ).map(([key, labels]) => (
                      <div key={key}>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                          {t(key)}
                        </h4>
                        <p className="text-lg text-gray-900">{joinLookupLabels(labels) || "—"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                    <Languages className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                      {t("map.languages")}
                    </h4>
                    <p className="text-lg text-gray-900">{languageLabel(selectedSchool.languages) || "—"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                      {t("catalog.cost")}
                    </h4>
                    {costStatusOf(selectedSchool) === "unknown" ? (
                      <p className="text-lg text-gray-900">{t("catalog.costUnknown")}</p>
                    ) : (
                      <>
                        <p className="text-lg text-gray-900">{costAmount(selectedSchool) || "—"}</p>
                        <p className="text-sm text-gray-500">{costPhrase(selectedSchool)}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <DistrictMiniMap school={selectedSchool} />
              <div className="md:col-span-2 rounded-xl overflow-hidden border border-gray-200 shadow-inner">
                <MapView schools={[selectedSchool]} apiKey={apiKey} height="300px" />
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-blue-50 rounded-xl">
              <div className="p-3 bg-white rounded-lg text-blue-600 shadow-sm">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  {t("catalog.comment")}
                </h4>
                {isLoadingDescription ? (
                  <div className="flex items-center gap-2 text-gray-400 mt-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t("catalog.loadingDescription")}</span>
                  </div>
                ) : (
                  <p className="text-lg text-gray-900 leading-relaxed whitespace-pre-wrap">
                    {description !== null ? description : selectedSchool.comment || "—"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {schools.map((school, index) => (
            <motion.div
              key={school.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
            >
              <SchoolCard school={school} prefix={prefix} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Catalog;
