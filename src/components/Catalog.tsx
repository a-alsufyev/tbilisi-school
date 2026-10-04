import React from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { School } from "../types";
import { ArrowLeft, MapPin, Languages, CreditCard, BookOpen, MessageSquare, Loader2, Globe } from "lucide-react";
import { externalHref } from "../lib/website";
import { localeSchoolName, primarySchoolName } from "../hooks/useSchoolTranslations";
import { costStatusOf } from "../lib/cost";
import { normalizeUiLanguage } from "../lib/schools";
import MapView from "./Map";

interface CatalogProps {
  schools: School[];
  apiKey: string;
  selectedSchool: School | null;
}

const Catalog: React.FC<CatalogProps> = ({ schools, apiKey, selectedSchool }) => {
  const { t, i18n } = useTranslation();
  const { lang } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
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

  const handleBack = () => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate(`${prefix}/schools`);
    }
  };

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
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("catalog.back")}
            </button>
            {isLoadingDescription && (
              <div className="flex items-center gap-2 text-gray-400 text-xs italic">
                <Loader2 className="w-3 h-3 animate-spin" />
                {t("catalog.loadingDescription")}
              </div>
            )}
          </div>

          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900">{primaryName}</h2>
              {localName && (
                <p className="text-xl text-gray-500 mt-1 font-medium">{localName}</p>
              )}
            </div>

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
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                      {t("catalog.program")}
                    </h4>
                    <p className="text-lg text-gray-900">{selectedSchool.program || "—"}</p>
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
                    <p className="text-lg text-gray-900">{selectedSchool.languages}</p>
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
                        <p className="text-lg text-gray-900">{selectedSchool.cost || "—"}</p>
                        <p className="text-sm text-gray-500">
                          {t(
                            costStatusOf(selectedSchool) === "official"
                              ? "catalog.costOfficial"
                              : "catalog.costApproximate"
                          )}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-inner mb-8">
              <MapView schools={[selectedSchool]} apiKey={apiKey} height="300px" />
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
          {schools.map((school, index) => {
            const primaryName = getPrimaryName(school);
            const localName = getLocaleName(school);

            return (
              <motion.div
                key={school.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <Link
                  to={`${prefix}/schools/${school.slug}`}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-all group block h-full"
                >
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {primaryName}
                    </h3>
                    {localName && (
                      <p className="text-sm text-gray-500 font-medium">{localName}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{school.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Languages className="w-4 h-4 flex-shrink-0" />
                      <span>{school.languages}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <CreditCard className="w-4 h-4 flex-shrink-0" />
                      <span>
                        {costStatusOf(school) === "unknown"
                          ? t("catalog.costUnknown")
                          : school.cost
                            ? `${school.cost} · ${t(costStatusOf(school) === "official" ? "catalog.costOfficial" : "catalog.costApproximate")}`
                            : t(costStatusOf(school) === "official" ? "catalog.costOfficial" : "catalog.costApproximate")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-50 flex justify-end">
                    <span className="text-indigo-600 text-sm font-semibold group-hover:underline">
                      {t("catalog.viewDetails")} →
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Catalog;
