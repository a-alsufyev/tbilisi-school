import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { applySeo, matchPath, readSiteOrigin, resolveSeo } from "../seo/document";
import { normalizeUiLanguage } from "../lib/schools";
import type { School } from "../types";

type PageSeoProps = {
  schools: School[];
  loadError: boolean;
};

type SchoolExtra = {
  path: string;
  description: string | null;
  hasCover: boolean;
};

export default function PageSeo({ schools, loadError }: PageSeoProps) {
  const location = useLocation();
  const landedOn = useRef(location.pathname);
  const [extra, setExtra] = useState<SchoolExtra | null>(null);

  useEffect(() => {
    const match = matchPath(location.pathname);
    if (match.kind !== "school") {
      setExtra(null);
      return;
    }

    const path = location.pathname;
    let cancelled = false;
    const locale = normalizeUiLanguage(match.lang);
    const description = fetch(
      `/api/schools/${encodeURIComponent(match.slug)}/description?locale=${encodeURIComponent(locale)}`
    )
      .then(async (response) => {
        if (!response.ok) return null;
        const body = (await response.json()) as { description?: unknown };
        return typeof body.description === "string" ? body.description : null;
      })
      .catch(() => null);
    const cover = fetch(`/schools/${encodeURIComponent(match.slug)}.jpg`, { method: "HEAD" })
      .then((response) => response.ok && (response.headers.get("content-type") ?? "").startsWith("image/"))
      .catch(() => false);

    void Promise.all([description, cover]).then(([text, hasCover]) => {
      if (!cancelled) setExtra({ path, description: text, hasCover });
    });

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  useEffect(() => {
    const match = matchPath(location.pathname);
    const waitingForServerCopy =
      match.kind === "school" && location.pathname === landedOn.current && extra?.path !== location.pathname;
    if (waitingForServerCopy) return;

    const ready = extra?.path === location.pathname ? extra : null;
    applySeo(
      resolveSeo({
        origin: readSiteOrigin(),
        pathname: location.pathname,
        search: location.search,
        schools,
        catalogKnown: !loadError,
        description: ready?.description ?? null,
        hasCover: ready?.hasCover ?? false,
      })
    );
  }, [extra, loadError, location.pathname, location.search, schools]);

  return null;
}
