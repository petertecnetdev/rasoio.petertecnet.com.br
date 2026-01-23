// src/pages/auth/PasswordResetPage.jsx
import React, { useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

import { apiBaseUrl } from "../../config";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import GlobalButton from "../../components/GlobalButton";

import "./PasswordResetPage.css";

const fieldLabelMap = {
  email: "E-mail",
  reset_password_code: "Código",
  password: "Nova senha",
  password_confirmation: "Confirmar senha",
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

  const msg = data?.error || data?.message || "Não foi possível redefinir a senha.";
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

export default function PasswordResetPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);

  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      String(email || "").trim().length > 3 &&
      String(resetCode || "").trim().length >= 8 &&
      String(password || "").trim().length >= 6 &&
      String(passwordConfirmation || "").trim().length >= 6
    );
  }, [email, resetCode, password, passwordConfirmation]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (password !== passwordConfirmation) {
      Swal.fire({
        title: "Erro",
        html: buildHtmlListErrors([
          { label: "Confirmar senha", message: "As senhas não coincidem." },
        ]),
        icon: "error",
        confirmButtonText: "Ok",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });
      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.post(`${apiBaseUrl}/auth/password-reset`, {
        email: String(email || "").trim(),
        reset_password_code: String(resetCode || "").trim(),
        password,
      });

      await Swal.fire({
        title: "Senha alterada",
        text: data?.message || "Sua senha foi redefinida com sucesso.",
        icon: "success",
        confirmButtonText: "Entrar",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });

      navigate("/login", { replace: true });
    } catch (err) {
      const data = err?.response?.data || null;
      const list = normalizeApiErrors(data);

      Swal.fire({
        title: "Erro ao redefinir senha",
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

  // 🔒 BLOQUEIO TOTAL DA UI (mantendo seu padrão)
  if (loading) {
    return (
      <ProcessingIndicatorComponent
        messages={[
          "Redefinindo senha...",
          "Validando código...",
          "Finalizando...",
        ]}
      />
    );
  }

  return (
    <div className="prp">
      {/* efeitos de fundo */}
      <div className="prp__bg">
        <div className="prp__noise" />
        <div className="prp__orb prp__orb--a" />
        <div className="prp__orb prp__orb--b" />
        <div className="prp__grid" />
      </div>

      <div className="prp__container">
        <div className="prp__layout">
          {/* HERO */}
          <aside className="prp__hero">
            <div className="prp__heroCard">
              <div className="prp__heroTop">
                <div className="prp__heroLogoWrap" aria-hidden="true">
                  <img
                    src="/images/logo.png"
                    alt=""
                    className="prp__heroLogo"
                    draggable={false}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/images/logo.gif";
                    }}
                  />
                </div>

                <div className="prp__heroText">
                  <h1 className="prp__heroTitle">Rasoio</h1>
                  <p className="prp__heroSubtitle">
                    Recupere seu acesso com segurança usando o código de redefinição
                    enviado por e-mail.
                  </p>
                </div>
              </div>

              <div className="prp__heroInfo">
                <div className="prp__heroBadge">
                  <span className="prp__dot" />
                  Processo rápido • Seguro • Confirmado por código
                </div>

                <ul className="prp__heroList">
                  <li>
                    <span className="prp__check">✓</span>
                    <div className="prp__heroListText">
                      Digite o <b>e-mail</b> e o <b>código recebido</b>.
                    </div>
                  </li>

                  <li>
                    <span className="prp__check">✓</span>
                    <div className="prp__heroListText">
                      Crie uma senha forte para manter sua conta protegida.
                    </div>
                  </li>

                  <li>
                    <span className="prp__check">✓</span>
                    <div className="prp__heroListText">
                      Em segundos você volta ao sistema e retoma seus agendamentos.
                    </div>
                  </li>
                </ul>

                <div className="prp__heroStats">
                  <div className="prp__stat">
                    <div className="prp__statValue">8</div>
                    <div className="prp__statLabel">caracteres no código</div>
                  </div>
                  <div className="prp__stat">
                    <div className="prp__statValue">10min</div>
                    <div className="prp__statLabel">validade do código</div>
                  </div>
                  <div className="prp__stat">
                    <div className="prp__statValue">🔐</div>
                    <div className="prp__statLabel">segurança total</div>
                  </div>
                </div>

                <div className="prp__heroFootnote">
                  <span className="prp__shield" aria-hidden="true">
                    🛡️
                  </span>
                  Se não encontrar o código, confira spam/lixo eletrônico.
                </div>
              </div>
            </div>
          </aside>

          {/* CARD */}
          <main className="prp__main">
            <div className="prp__card">
              <header className="prp__cardHeader">
                <div className="prp__logoWrap">
                  <img
                    src="/images/logo.png"
                    alt="Rasoio"
                    className="prp__logo"
                    draggable={false}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/images/logo.gif";
                    }}
                  />
                </div>

                <h2 className="prp__title">Redefinir senha</h2>
                <p className="prp__subtitle">
                  Informe o código recebido e defina sua nova senha.
                </p>
              </header>

              <section className="prp__cardBody">
                <form className="prp__form" onSubmit={handleSubmit}>
                  {/* EMAIL */}
                  <div className="prp__field">
                    <label className="prp__label" htmlFor="pr-email">
                      E-mail
                    </label>

                    <div className="prp__inputWrap">
                      <span className="prp__icon" aria-hidden="true">
                        ✉
                      </span>

                      <input
                        id="pr-email"
                        type="email"
                        placeholder="seuemail@exemplo.com"
                        className="prp__input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* CODE */}
                  <div className="prp__field">
                    <label className="prp__label" htmlFor="pr-code">
                      Código
                    </label>

                    <div className="prp__inputWrap">
                      <span className="prp__icon" aria-hidden="true">
                        🔑
                      </span>

                      <input
                        id="pr-code"
                        type="text"
                        placeholder="Código de redefinição"
                        className="prp__input"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        required
                      />
                    </div>

                    <div className="prp__hint">
                      Código enviado para o seu e-mail (8 caracteres).
                    </div>
                  </div>

                  {/* PASSWORD */}
                  <div className="prp__field">
                    <label className="prp__label" htmlFor="pr-pass">
                      Nova senha
                    </label>

                    <div className="prp__inputWrap prp__inputWrap--password">
                      <span className="prp__icon" aria-hidden="true">
                        🔒
                      </span>

                      <input
                        id="pr-pass"
                        type={showPass ? "text" : "password"}
                        placeholder="Crie uma nova senha"
                        className="prp__input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />

                      <button
                        type="button"
                        className="prp__toggle"
                        onClick={() => setShowPass((v) => !v)}
                        aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                        title={showPass ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPass ? "Ocultar" : "Mostrar"}
                      </button>
                    </div>

                    <div className="prp__hint">
                      Use: maiúscula, minúscula, número e especial.
                    </div>
                  </div>

                  {/* PASSWORD CONFIRM */}
                  <div className="prp__field">
                    <label className="prp__label" htmlFor="pr-pass2">
                      Confirmar senha
                    </label>

                    <div className="prp__inputWrap prp__inputWrap--password">
                      <span className="prp__icon" aria-hidden="true">
                        ✅
                      </span>

                      <input
                        id="pr-pass2"
                        type={showPass2 ? "text" : "password"}
                        placeholder="Digite novamente"
                        className="prp__input"
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        required
                      />

                      <button
                        type="button"
                        className="prp__toggle"
                        onClick={() => setShowPass2((v) => !v)}
                        aria-label={showPass2 ? "Ocultar senha" : "Mostrar senha"}
                        title={showPass2 ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPass2 ? "Ocultar" : "Mostrar"}
                      </button>
                    </div>

                    <div className="prp__match">
                      {passwordConfirmation.length > 0 ? (
                        password === passwordConfirmation ? (
                          <span className="prp__ok">Senhas conferem ✓</span>
                        ) : (
                          <span className="prp__bad">Senhas não conferem</span>
                        )
                      ) : (
                        <span className="prp__muted">Confirme sua senha</span>
                      )}
                    </div>
                  </div>

                  {/* SUBMIT */}
                  <GlobalButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    full
                    rounded
                    className="prp__submitBtn"
                    disabled={!canSubmit}
                  >
                    Alterar senha
                  </GlobalButton>
                </form>
              </section>

              <footer className="prp__cardFooter">
                <div className="prp__footerLine" />

                <div className="prp__footerActions">
                  <GlobalButton
                    variant="ghost"
                    size="sm"
                    rounded
                    onClick={() => navigate("/password-email")}
                    className="prp__footerBtn"
                  >
                    Pedir novo código
                  </GlobalButton>

                  <span className="prp__sep">•</span>

                  <GlobalButton
                    variant="ghost"
                    size="sm"
                    rounded
                    onClick={() => navigate("/login")}
                    className="prp__footerBtn"
                  >
                    Voltar ao login
                  </GlobalButton>
                </div>

                <small className="prp__footerText">
                  Se não recebeu o código, tente novamente ou revise seu e-mail.
                </small>
              </footer>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
