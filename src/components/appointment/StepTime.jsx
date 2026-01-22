import React, { useMemo } from "react";
import PropTypes from "prop-types";
import "./StepTime.css";

export default function StepTime({
  availableTimes = [],
  selected = null,
  onChange,
  loading = false,
  title = "Escolha o Horário",
  subtitle = "Selecione um horário disponível para o seu atendimento",
}) {
  const uniqueTimes = useMemo(() => {
    const safe = Array.isArray(availableTimes) ? availableTimes : [];
    return [...new Set(safe.filter(Boolean))];
  }, [availableTimes]);

  return (
    <div className="stt">
      <div className="stt__head">
        <div className="stt__titleWrap">
          <h4 className="stt__title">{title}</h4>
          <div className="stt__subtitle">{subtitle}</div>
        </div>

        {!!selected && (
          <div className="stt__selected">
            <span className="stt__selectedLabel">Selecionado</span>
            <span className="stt__selectedValue">{selected}</span>
          </div>
        )}
      </div>

      <div className="stt__body">
        {loading ? (
          <div className="stt__loading">
            <div className="stt__spinner" />
            <div className="stt__loadingText">Carregando horários...</div>
          </div>
        ) : uniqueTimes.length ? (
          <div className="stt__grid">
            {uniqueTimes.map((t) => {
              const active = selected === t;

              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => onChange?.(t)}
                  className={`stt__btn ${active ? "is-active" : ""}`}
                >
                  <span className="stt__btnTime">{t}</span>
                  <span className="stt__btnHint">{active ? "Selecionado" : "Toque para escolher"}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="stt__empty">
            <div className="stt__emptyIcon">🗓️</div>
            <div className="stt__emptyTitle">Nenhum horário disponível</div>
            <div className="stt__emptyText">
              Tente selecionar outra data para ver novos horários.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

StepTime.propTypes = {
  availableTimes: PropTypes.array,
  selected: PropTypes.string,
  onChange: PropTypes.func,
  loading: PropTypes.bool,
  title: PropTypes.string,
  subtitle: PropTypes.string,
};
