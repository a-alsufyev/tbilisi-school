import { useCallback, useEffect, useState } from "react";
import AdminLogin from "../components/admin/AdminLogin";
import AdminWorkspace from "../components/admin/AdminWorkspace";

type Gate = "loading" | "guest" | "in";

export default function AdminPage() {
  const [gate, setGate] = useState<Gate>("loading");
  const [misconfigured, setMisconfigured] = useState(false);
  const leave = useCallback(() => setGate("guest"), []);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const response = await fetch("/api/admin/session");
        if (cancelled) return;
        if (response.ok) {
          setGate("in");
          return;
        }
        setMisconfigured(response.status === 503);
        setGate("guest");
      } catch {
        if (!cancelled) setGate("guest");
      }
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  if (gate === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (gate === "guest") {
    return <AdminLogin misconfigured={misconfigured} onSuccess={() => setGate("in")} />;
  }

  return <AdminWorkspace onLogout={leave} />;
}
