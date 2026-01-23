// src/pages/auth/PasswordEmailPage.jsx
import React, { useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

import { apiBaseUrl } from "../../config";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import GlobalButton from "../../components/GlobalButton";

import "./PasswordEmailPage.css";

const fieldLabelMap = {
  email: "E-mail",
};

const normalizeApiErrors = (data) => {
  const errors = data?.errors;

  if (errors && typeof errors === "object") {
    const items = [];
    Object.entries(errors).forEach(([field, messages]) => {
      const label = fieldLabelMap[field] || field;
      const arr = Array.isArray(messages) ? messages : [messages];
      arr
        .filter(Boolean)
        .forEach((m) => items.push({ field, label, message: String(m) }));
    });
    return items;
  }

  const msg =
    data?.error ||
    data?.message ||
    "Erro ao enviar o código. Tente novamente.";
  return [{ field: null, label: "Erro", message: String(msg) }];
};

const buildHtmlListErrors = (items = []) => {
  if (!items.length) return "";
  return `
    <div style="text-align:left; line-height:1.35;">
      <div style="margin-bottom:8px; font-weight:800;">Verifique:</div>
      <ul style="margin:0; padding-left:18px;">
        ${items.map((it) => `<li><b>${it.label}:</b> ${it.message}</li>`).join("")}
      </ul>
    </div>
  `;
};

export default function PasswordEmailPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return String(email || "").trim().length > 3;
  }, [email]);

  const sendCode = async (targetEmail) => {
    setLoading(true);

    try {
      const { data } = await axios.post(`${apiBaseUrl}/auth/password-email`, {
        email: String(targetEmail || "").trim(),
      });

      Swal.fire({
        title: "Sucesso",
        text:
          data?.message ||
          "Código enviado para seu e-mail. Verifique sua caixa de entrada.",
        icon: "success",
        showCancelButton: true,
        confirmButtonText: "Recebi o código",
        cancelButtonText: "Reenviar",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/password-reset");
          return;
        }

        if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire({
            title: "Reenviar código",
            input: "email",
            inputValue: targetEmail,
            inputPlaceholder: "Digite seu e-mail",
            showCancelButton: true,
            confirmButtonText: "Reenviar",
            cancelButtonText: "Cancelar",
            customClass: {
              popup: "custom-swal",
              title: "custom-swal-title",
              content: "custom-swal-text",
            },
          }).then((resend) => {
            if (resend.isConfirmed) {
              const newEmail = String(resend.value || "").trim();
              if (!newEmail) return;
              setEmail(newEmail);
              sendCode(newEmail);
            }
          });
        }
      });
    } catch (err) {
      const data = err?.response?.data || null;
      const list = normalizeApiErrors(data);

      Swal.fire({
        title: "Erro ao enviar código",
        html: buildHtmlListErrors(list),
        icon: "error",
        confirmButtonText: "Ok",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    sendCode(email);
  };

  // 🔒 BLOQUEIO TOTAL (padrão do projeto)
  if (loading) {
    return (
      <ProcessingIndicatorComponent
        messages={[
          "Enviando código...",
          "Validando e-mail...",
          "Quase lá...",
          "Verifique seu e-mail",
        ]}
      />
    );
  }

  return (
    <div className="pep">
      {/* efeitos de fundo */}
      <div className="pep__bg">
        <div className="pep__noise" />
        <div className="pep__orb pep__orb--a" />
        <div className="pep__orb pep__orb--b" />
        <div className="pep__grid" />
      </div>

      <div className="pep__container">
        <div className="pep__layout">
          {/* HERO */}
          <aside className="pep__hero">
            <div className="pep__heroCard">
              <div className="pep__heroTop">
                <div className="pep__heroLogoWrap" aria-hidden="true">
                  <img
                    src="/images/logo.png"
                    alt=""
                    className="pep__heroLogo"
                    draggable={false}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/images/logo.gif";
                    }}
                  />
                </div>

                <div className="pep__heroText">
                  <h1 className="pep__heroTitle">Rasoio</h1>
                  <p className="pep__heroSubtitle">
                    Vamos recuperar seu acesso com segurança. Você receberá um
                    código no e-mail para redefinir sua senha.
                  </p>
                </div>
              </div>

              <div className="pep__heroInfo">
                <div className="pep__heroBadge">
                  <span className="pep__dot" />
                  Processo rápido • Verificado por e-mail • Seguro
                </div>

                <ul className="pep__heroList">
                  <li>
                    <span className="pep__check">✓</span>
                    <div className="pep__heroListText">
                      Informe seu <b>e-mail cadastrado</b>.
                    </div>
                  </li>
                  <li>
                    <span className="pep__check">✓</span>
                    <div className="pep__heroListText">
                      Você receberá um <b>código de redefinição</b>.
                    </div>
                  </li>
                  <li>
                    <span className="pep__check">✓</span>
                    <div className="pep__heroListText">
                      Em seguida, crie uma <b>nova senha</b> e volte ao sistema.
                    </div>
                  </li>
                </ul>

                <div className="pep__heroFootnote">
                  <span className="pep__shield" aria-hidden="true">
                    🛡️
                  </span>
                  Dica: caso não encontre o código, verifique Spam/Lixo eletrônico.
                </div>
              </div>
            </div>
          </aside>

          {/* CARD */}
          <main className="pep__main">
            <div className="pep__card">
              <header className="pep__cardHeader">
                <div className="pep__logoWrap">
                  <img
                    src="/images/logo.png"
                    alt="Rasoio"
                    className="pep__logo"
                    draggable={false}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/images/logo.gif";
                    }}
                  />
                </div>

                <h2 className="pep__title">Recuperar senha</h2>
                <p className="pep__subtitle">
                  Digite seu e-mail para receber o código de recuperação.
                </p>
              </header>

              <section className="pep__cardBody">
                <form className="pep__form" onSubmit={handleSubmit}>
                  <div className="pep__field">
                    <label className="pep__label" htmlFor="pep-email">
                      E-mail
                    </label>

                    <div className="pep__inputWrap">
                      <span className="pep__icon" aria-hidden="true">
                        ✉
                      </span>

                      <input
                        id="pep-email"
                        type="email"
                        placeholder="seuemail@exemplo.com"
                        className="pep__input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="pep__hint">
                      Enviaremos um código de verificação para este e-mail.
                    </div>
                  </div>

                  <GlobalButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    full
                    rounded
                    className="pep__submitBtn"
                    disabled={!canSubmit}
                  >
                    Enviar código
                  </GlobalButton>
                </form>
              </section>

              <footer className="pep__cardFooter">
                <div className="pep__footerLine" />

                <div className="pep__footerActions">
                  <GlobalButton
                    variant="ghost"
                    size="sm"
                    rounded
                    onClick={() => navigate("/login")}
                    className="pep__footerBtn"
                  >
                    Voltar ao login
                  </GlobalButton>

                  <span className="pep__sep">•</span>

                  <GlobalButton
                    variant="ghost"
                    size="sm"
                    rounded
                    onClick={() => navigate("/register")}
                    className="pep__footerBtn"
                  >
                    Criar conta
                  </GlobalButton>
                </div>

                <small className="pep__footerText">
                  Não lembra o e-mail cadastrado? Entre em contato com o suporte.
                </small>
              </footer>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
