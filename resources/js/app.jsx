import "../css/app.css";
import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";

const pages = {
  portal: lazy(() => import("./app/PublicPortal.jsx")),
  login: lazy(() => import("./app/LoginPage.jsx")),
  dashboard: lazy(() => import("./app/DispatcherDashboard.jsx")),
};

const root = document.getElementById("app");
const Page = pages[root?.dataset.page];

if (root && Page) {
  const userData = root.dataset.user;
  window.AuthUser = userData ? JSON.parse(userData) : null;
  
  createRoot(root).render(
    <Suspense fallback={null}>
      <Page />
    </Suspense>,
  );
} else if (root) {
  console.error(`Unknown page: "${root.dataset.page}"`);
}
