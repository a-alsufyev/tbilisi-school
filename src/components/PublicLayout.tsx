import { useEffect, useState } from "react";
import LangLayout from "./LangLayout";
import type { Config, School } from "../types";

export default function PublicLayout() {
  const [schools, setSchools] = useState<School[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schoolsRes, configRes] = await Promise.all([
          fetch("/api/schools"),
          fetch("/api/config"),
        ]);

        if (schoolsRes.ok) {
          setSchools(await schoolsRes.json());
        } else {
          setLoadError(true);
        }

        if (configRes.ok) {
          setConfig(await configRes.json());
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <LangLayout schools={schools} config={config} loadError={loadError} />;
}
