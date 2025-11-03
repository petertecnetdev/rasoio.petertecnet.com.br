import React, { useEffect } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
import "./steps.css";

dayjs.extend(utc);
dayjs.extend(tz);

export default function StepConfirm({ services, employer, date, time, total, duration }) {
  const fmtBRL = (v) => `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;

  // 🕒 Força exibição no fuso de São Paulo
  let formattedDate = "";
  try {
    if (date) {
      // Se vier como "2025-11-03" (sem hora)
      if (!date.includes("T")) {
        formattedDate = dayjs.tz(`${date}T12:00:00`, "America/Sao_Paulo").format("DD/MM/YYYY");
      } 
      // Se vier com hora ISO completa
      else {
        formattedDate = dayjs(date).tz("America/Sao_Paulo").format("DD/MM/YYYY");
      }
    }
  } catch (err) {
    console.error("❌ Erro ao formatar data:", err);
  }

  // 🔍 Log pra confirmar o que está vindo
  useEffect(() => {
    console.log("🧠 [StepConfirm] Debug data render:", {
      raw_date: date,
      parsed_dayjs: date ? dayjs(date).format() : null,
      formattedDate,
      browserTimezone: dayjs.tz.guess(),
    });
  }, [date]);

  return (
    <div className="step-container">
      <h4>Confirmar Agendamento</h4>
      <p><b>Profissional:</b> {employer?.user?.first_name || "—"}</p>
      <p><b>Data:</b> {formattedDate || "Data não informada"}</p>
      <p><b>Horário:</b> {time || "Horário não informado"}</p>
      <ul>
        {services.map((s) => (
          <li key={s.id || s.item_id}>
            {s.name} — {fmtBRL(s.price)}
          </li>
        ))}
      </ul>
      <hr />
      <p>
        <b>Total:</b> {fmtBRL(total)} | <b>Duração:</b> {duration} min
      </p>
    </div>
  );
}
