import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import AppErrorBoundary from "./components/AppErrorBoundary";
import PeterTecnetSignature from "./components/PeterTecnetSignature";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
      <PeterTecnetSignature />
    </AppErrorBoundary>
  </React.StrictMode>
);
