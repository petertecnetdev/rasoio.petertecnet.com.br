import { startTelemetry } from "./telemetry";
import { apiBaseUrl, appId, appSlug } from "./config";
import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import App from "./App";
import AppErrorBoundary from "./components/AppErrorBoundary";
import PeterTecnetSignature from "./components/PeterTecnetSignature";
import PeterAccountGateway from "./components/PeterAccountGateway";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import "./styles/appointment-step1-compact.css";
import "./styles/appointment-wizard-responsive.css";

startTelemetry({ apiBaseUrl, appSlug, appId });

axios.defaults.headers.common["X-Peter-App"] = appSlug;
axios.defaults.headers.common["X-App-ID"] = String(appId);

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <PeterAccountGateway apiBaseUrl={apiBaseUrl} appSlug={appSlug}>
      <AppErrorBoundary>
        <App />
        <PeterTecnetSignature />
      </AppErrorBoundary>
    </PeterAccountGateway>
  </React.StrictMode>
);
