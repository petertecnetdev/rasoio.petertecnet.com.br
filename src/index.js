import { startTelemetrySafely } from "./utils/startTelemetrySafely";
import { apiBaseUrl, appId, appSlug } from "./config";
import { installGlobalImageFallbacks } from "./utils/imageFallback";
import { installPasswordFieldEnhancer } from "./utils/passwordFieldEnhancer";
import { installPeterWhatsappFallback } from "./utils/peterWhatsappFallback";
import { installAppointmentAcquisitionAttribution } from "./utils/appointmentAcquisitionAttribution";
import { installAppointmentFunnelTelemetry } from "./appointmentFunnelTelemetry";
import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import App from "./App";
import GlobalImageInputEnhancer from "./components/GlobalImageInputEnhancer";
import AppErrorBoundary from "./components/AppErrorBoundary";
import PeterTecnetSignature from "./components/PeterTecnetSignature";
import PeterAccountGateway from "./components/PeterAccountGateway";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import "./styles/appointment-step1-compact.css";
import "./styles/appointment-wizard-responsive.css";
import "./styles/nexus-mobile-nav.css";

installGlobalImageFallbacks();
installPasswordFieldEnhancer();
installPeterWhatsappFallback();
installAppointmentAcquisitionAttribution();
startTelemetrySafely({ apiBaseUrl, appSlug, appId });
installAppointmentFunnelTelemetry();

axios.defaults.headers.common["X-Peter-App"] = appSlug;
axios.defaults.headers.common["X-App-ID"] = String(appId);

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <PeterAccountGateway apiBaseUrl={apiBaseUrl} appSlug={appSlug}>
      <AppErrorBoundary>
        <App />
        <PeterTecnetSignature />
        <GlobalImageInputEnhancer />
      </AppErrorBoundary>
    </PeterAccountGateway>
  </React.StrictMode>
);
