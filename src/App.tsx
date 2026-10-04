/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Route, Routes } from "react-router-dom";
import PublicLayout from "./components/PublicLayout";
import NotFound from "./components/NotFound";
import About from "./components/About";
import Directory from "./components/Directory";
import CatalogListPage from "./pages/CatalogListPage";
import MapPage from "./pages/MapPage";
import RootRedirect from "./pages/RootRedirect";
import SchoolPage from "./pages/SchoolPage";
import AdminPage from "./pages/AdminPage";
import AssistantPage from "./pages/AssistantPage";

export default function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/" element={<RootRedirect />} />
      <Route path="/:lang" element={<PublicLayout />}>
        <Route index element={<MapPage />} />
        <Route path="schools" element={<CatalogListPage />} />
        <Route path="schools/:slug" element={<SchoolPage />} />
        <Route path="directory" element={<Directory />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="about" element={<About />} />
        <Route path="login" element={<NotFound />} />
        <Route path="register" element={<NotFound />} />
        <Route path="account" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
