import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

const isStandalone = () => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator?.standalone === true
  );
};

const isMobileDevice = () => {
  if (typeof window === "undefined") return false;
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches;
  const narrowViewport = window.matchMedia?.("(max-width: 900px)")?.matches;
  return Boolean(coarsePointer && narrowViewport);
};

const isIos = () => {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent || "");
};

export default function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [mobile, setMobile] = useState(isMobileDevice);
  const ios = useMemo(isIos, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const updateEnvironment = () => {
      setInstalled(isStandalone());
      setMobile(isMobileDevice());
    };

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
      updateEnvironment();
    };

    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    window.addEventListener("resize", updateEnvironment);

    updateEnvironment();

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      window.removeEventListener("resize", updateEnvironment);
    };
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        if (choice?.outcome === "accepted") setInstalled(true);
      } finally {
        setInstallPrompt(null);
      }
      return;
    }

    if (ios) {
      await Swal.fire({
        background: "#0a0a0c",
        color: "#fff",
        icon: "info",
        title: "Instalar Rasoio",
        html: "No Safari, toque em <strong>Compartilhar</strong> e depois em <strong>Adicionar à Tela de Início</strong>.",
        confirmButtonColor: "#00aaff",
      });
      return;
    }

    await Swal.fire({
      background: "#0a0a0c",
      color: "#fff",
      icon: "info",
      title: "Instalar Rasoio",
      text: "Abra esta página no navegador principal do celular e use a opção de instalar aplicativo no menu do navegador.",
      confirmButtonColor: "#00aaff",
    });
  };

  if (!mobile || installed) return null;

  return (
    <button
      type="button"
      onClick={handleInstall}
      aria-label="Instalar aplicativo Rasoio"
      style={{
        position: "fixed",
        right: "max(14px, env(safe-area-inset-right))",
        bottom: "calc(var(--gfooter-height, 0px) + max(14px, env(safe-area-inset-bottom)))",
        zIndex: 1050,
        minHeight: 48,
        padding: "0 18px",
        border: "1px solid rgba(255,255,255,.18)",
        borderRadius: 999,
        background: "rgba(8, 12, 18, .94)",
        color: "#fff",
        boxShadow: "0 12px 34px rgba(0,0,0,.35)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        fontWeight: 700,
        fontSize: 14,
        cursor: "pointer",
      }}
    >
      Instalar aplicativo
    </button>
  );
}
