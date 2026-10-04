import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const VISIT_SESSION_KEY = "tbilisi-schools-visit-counted";

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const [visits, setVisits] = useState<number | null>(null);

  useEffect(() => {
    const alreadyCounted = sessionStorage.getItem(VISIT_SESSION_KEY) === "1";

    const loadVisits = async () => {
      try {
        const res = await fetch("/api/visits", {
          method: alreadyCounted ? "GET" : "POST",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { total?: number };
        if (typeof data.total === "number") {
          setVisits(data.total);
          sessionStorage.setItem(VISIT_SESSION_KEY, "1");
        }
      } catch (error) {
        console.error("Error loading visits:", error);
      }
    };

    loadVisits();
  }, []);

  return (
    <footer className="w-full bg-white border-t border-gray-200 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-gray-600 mb-3">{t("footer.tagline")}</p>
        {visits !== null && (
          <p className="text-gray-500 text-sm mb-2">
            {t("footer.visits", { count: visits })}
          </p>
        )}
        <p className="text-gray-400 text-sm">
          © {new Date().getFullYear()} {t("footer.copyright")}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
