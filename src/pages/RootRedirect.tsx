import { Navigate } from "react-router-dom";
import { detectBrowserUiLanguage } from "../lib/schools";

export default function RootRedirect() {
  return <Navigate to={`/${detectBrowserUiLanguage()}`} replace />;
}
