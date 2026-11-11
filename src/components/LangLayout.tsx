import { useEffect } from "react";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "./Header";
import Footer from "./Footer";
import { isSupportedUiLang } from "../lib/schools";
import type { Config, School } from "../types";

const VISIT_SESSION_KEY = "tbilisi-schools-visit-counted";

type LangLayoutProps = {
  schools: School[];
  config: Config | null;
  loadError: boolean;
};

export default function LangLayout({ schools, config, loadError }: LangLayoutProps) {
  const { lang } = useParams();
  const location = useLocation();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (isSupportedUiLang(lang) && i18n.language !== lang) {
      void i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(VISIT_SESSION_KEY) === "1") return;
    } catch {
      return;
    }
    void fetch("/api/visits", { method: "POST" }).then((response) => {
      if (!response.ok) return;
      try {
        sessionStorage.setItem(VISIT_SESSION_KEY, "1");
      } catch {
        // The flag is only a same-tab guard, not a user record.
      }
    });
  }, []);

  if (!isSupportedUiLang(lang)) {
    const rest = location.pathname.replace(/^\/[^/]+/, "") || "";
    return <Navigate to={`/en${rest}${location.search}`} replace state={location.state} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Header />
      <main className="flex-grow">
        <Outlet context={{ schools, config, loadError }} />
      </main>
      <Footer />
    </div>
  );
}
