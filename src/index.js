import { startTelemetry } from "./telemetry";
import { apiBaseUrl, appSlug } from "./config";
import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import App from "./App";
import AppErrorBoundary from "./components/AppErrorBoundary";
import PeterTecnetSignature from "./components/PeterTecnetSignature";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import "./styles/appointment-step1-compact.css";
import "./styles/appointment-wizard-responsive.css";

startTelemetry({ apiBaseUrl, appSlug });

axios.defaults.headers.common["X-Peter-App"] = "rasoio";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
      <PeterTecnetSignature />
    </AppErrorBoundary>
  </React.StrictMode>
);
