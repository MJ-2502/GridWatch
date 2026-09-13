import "../css/app.css";
import React from "react";
import { createRoot } from "react-dom/client";
import DispatcherDashboard from "./app/DispatcherDashboard.jsx";

const root = document.getElementById("app");
if (root) createRoot(root).render(<DispatcherDashboard />);
