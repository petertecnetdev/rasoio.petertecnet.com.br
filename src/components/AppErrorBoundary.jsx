import React from "react";
import PropTypes from "prop-types";
import { apiBaseUrl, appId, appSlug } from "../config";

const CHUNK_ERROR_PATTERN = /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|CSS_CHUNK_LOAD_FAILED|dynamically imported module/i;
const RECOVERY_KEY = "rasoio_chunk_recovery";
const RECOVERY_WINDOW_MS = 30000;

function isChunkLoadError(error) {
  const message = [error?.name, error?.message, error?.stack].filter(Boolean).join(" ");
  return CHUNK_ERROR_PATTERN.test(message);
}

function createErrorId() {
  return window.crypto?.randomUUID?.() || `render-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function reportRenderError(error, info, errorId, chunkError) {
  try {
    const token = localStorage.getItem("token");
    const sessionKey = `peter_telemetry_session_${appSlug}`;
    const sessionId = sessionStorage.getItem(sessionKey) || errorId;
    const event = {
      id: errorId,
      type: "frontend_error",
      timestamp: new Date().toISOString(),
      page: window.location.pathname + window.location.search,
      label: String(error?.message || error?.name || "React render error").slice(0, 200),
      target: "AppErrorBoundary",
      metadata: {
        kind: chunkError ? "chunk_load_error" : "react_render_error",
        component_stack: String(info?.componentStack || "").replace(/\s+/g, " ").trim().slice(0, 500),
      },
    };

    fetch(`${String(apiBaseUrl).replace(/\/+$/, "")}/interactions/batch`, {
      method: "POST",
      keepalive: true,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Peter-App": appSlug,
        "X-App-Slug": appSlug,
        "X-Telemetry-Schema": "2",
        "X-Frontend-Page": window.location.href,
        "X-App-ID": String(appId),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ session_id: sessionId, events: [event] }),
    }).catch(() => {});
  } catch {
    // O tratamento de erro nunca deve causar um segundo erro.
  }
}

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorId: null, chunkError: false };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorId: createErrorId(),
      chunkError: isChunkLoadError(error),
    };
  }

  componentDidCatch(error, info) {
    const chunkError = isChunkLoadError(error);
    const errorId = this.state.errorId || createErrorId();

    console.error("Rasoio render error", { errorId, error, info });
    reportRenderError(error, info, errorId, chunkError);

    if (chunkError) {
      const now = Date.now();
      const previousAttempt = Number(sessionStorage.getItem(RECOVERY_KEY) || 0);

      if (!previousAttempt || now - previousAttempt > RECOVERY_WINDOW_MS) {
        sessionStorage.setItem(RECOVERY_KEY, String(now));

        window.setTimeout(async () => {
          try {
            await fetch(window.location.href, {
              cache: "reload",
              credentials: "same-origin",
            });
          } catch {
            // O reload abaixo continua sendo a recuperação principal.
          } finally {
            window.location.reload();
          }
        }, 250);
      }
    } else {
      sessionStorage.removeItem(RECOVERY_KEY);
    }
  }

  handleReload = () => {
    sessionStorage.removeItem(RECOVERY_KEY);
    window.location.reload();
  };

  handleHome = () => {
    sessionStorage.removeItem(RECOVERY_KEY);
    window.location.assign("/");
  };

  render() {
    if (this.state.hasError) {
      return (
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "24px",
            background: "radial-gradient(circle at 50% 18%, rgba(0,174,239,.12), transparent 28%), #03070d",
            color: "#f4f8fb",
          }}
        >
          <section style={{ width: "min(520px, 100%)", textAlign: "center" }}>
            <img
              src="/images/logo.png"
              alt="Rasoio"
              width="88"
              height="88"
              style={{ objectFit: "contain" }}
            />
            <h1 style={{ margin: "24px 0 10px", fontSize: "clamp(1.6rem, 4vw, 2.1rem)" }}>
              {this.state.chunkError ? "Atualizando a Rasoio…" : "Não foi possível exibir esta tela"}
            </h1>
            <p style={{ color: "#8795a7", lineHeight: 1.65, margin: "0 auto 22px" }}>
              {this.state.chunkError
                ? "Encontramos uma versão antiga da aplicação no navegador. Estamos recarregando os arquivos mais recentes automaticamente."
                : "Encontramos um erro inesperado nesta tela. O problema foi registrado para facilitar a correção."}
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{ border: 0, borderRadius: "12px", padding: "11px 18px", background: "#087ef5", color: "white", fontWeight: 800 }}
              >
                Tentar novamente
              </button>
              <button
                type="button"
                onClick={this.handleHome}
                style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: "12px", padding: "11px 18px", background: "rgba(255,255,255,.04)", color: "#dbe7f3", fontWeight: 800 }}
              >
                Ir para o início
              </button>
            </div>

            {this.state.errorId && !this.state.chunkError && (
              <small style={{ display: "block", marginTop: "18px", color: "#566578" }}>
                Código do erro: {this.state.errorId}
              </small>
            )}
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

AppErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};
