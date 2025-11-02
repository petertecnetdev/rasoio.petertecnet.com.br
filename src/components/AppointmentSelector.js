// src/components/AppointmentSelector.jsx
import React from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);
const PLACEHOLDER = "/images/logo.png";
const TZ = "America/Sao_Paulo";

const toDateKey = (d) =>
  new Date(d).toLocaleDateString("en-CA", { timeZone: TZ });

export default function AppointmentSelector({
  service,
  employers,
  loadAvailableTimes,
  handleCreateAppointment,
  imageUrl,
}) {
  const open = async (preselectedService = null) => {
    const days = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const key = toDateKey(d);
      const label = d.toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
      });
      days.push({ key, label });
    }

    let selectedDateKey = null;
    let selectedEmployer = null;
    let availableTimes = [];

    await MySwal.fire({
      width: "850px",
      background: "#0a0a0c",
      title: `<div style="font-size:20px;font-weight:700;color:#fff;">Agendar ${
        preselectedService ? preselectedService.name : "serviço"
      }</div>`,
      html: `
        <style>
          .swl-container{color:#fff;text-align:center}
          .swl-days{display:flex;justify-content:center;gap:6px;flex-wrap:wrap;margin-bottom:10px}
          .swl-day{background:#111;color:#fff;border:1px solid #00aaff;border-radius:8px;padding:8px 10px;cursor:pointer;min-width:65px;transition:0.3s}
          .swl-day:hover{background:#00aaff;color:#000}
          .swl-day.active{background:#00aaff;color:#000}
          .swl-emps{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:10px;margin-top:10px}
          .swl-emp{width:90px;padding:5px;background:#111;border-radius:10px;cursor:pointer;color:#fff;transition:0.3s}
          .swl-emp.active{border:2px solid #00ffff;box-shadow:0 0 10px rgba(0,255,255,0.5)}
          .swl-times{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:10px}
          .swl-time{background:#111;color:#fff;border:1px solid #00aaff;border-radius:8px;padding:6px 12px;cursor:pointer;transition:0.3s}
          .swl-time:hover{background:#00ffff;color:#000}
        </style>
        <div class="swl-container">
          <div class="swl-days">
            ${days
              .map(
                (d) =>
                  `<button class="swl-day" data-key="${d.key}">${d.label}</button>`
              )
              .join("")}
          </div>
          <div style="margin-top:15px;">Selecione um profissional</div>
          <div class="swl-emps">
            ${employers
              .map(
                (e) => `
              <div class="swl-emp" data-id="${e.id}">
                <img src="${imageUrl(
                  e.user?.avatar
                )}" onerror="this.src='${PLACEHOLDER}'" style="width:60px;height:60px;border-radius:50%;object-fit:cover;margin-bottom:4px;"/>
                <div style="font-size:13px;">${
                  e.user?.first_name || "Profissional"
                }</div>
              </div>`
              )
              .join("")}
          </div>
          <div style="margin-top:10px;">Horários disponíveis</div>
          <div id="swl-times" class="swl-times"></div>
        </div>
      `,
      showConfirmButton: false,
      didOpen: () => {
        const root = MySwal.getHtmlContainer();
        const daysBtns = root.querySelectorAll(".swl-day");
        const empBtns = root.querySelectorAll(".swl-emp");
        const timesDiv = root.querySelector("#swl-times");

        const renderTimes = async () => {
          timesDiv.innerHTML =
            '<div class="text-muted small">Carregando horários...</div>';
          if (!selectedDateKey || !selectedEmployer) {
            timesDiv.innerHTML =
              '<div class="text-muted small">Selecione data e profissional.</div>';
            return;
          }
          availableTimes = await loadAvailableTimes(
            selectedDateKey,
            selectedEmployer,
            preselectedService?.duration || 30
          );
          timesDiv.innerHTML = availableTimes.length
            ? availableTimes
                .map(
                  (t) =>
                    `<button class="swl-time" data-time="${t}">${t}</button>`
                )
                .join("")
            : '<div class="text-muted small">Nenhum horário disponível.</div>';

          timesDiv.querySelectorAll(".swl-time").forEach((btn) =>
            btn.addEventListener("click", async () => {
              await handleCreateAppointment(
                preselectedService,
                selectedEmployer,
                selectedDateKey,
                btn.getAttribute("data-time")
              );
            })
          );
        };

        const updateAndRender = async () => {
          if (selectedDateKey && selectedEmployer) await renderTimes();
        };

        daysBtns.forEach((btn) =>
          btn.addEventListener("click", async () => {
            daysBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            selectedDateKey = btn.getAttribute("data-key");
            await updateAndRender();
          })
        );

        empBtns.forEach((btn) =>
          btn.addEventListener("click", async () => {
            empBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            const id = Number(btn.getAttribute("data-id"));
            selectedEmployer = employers.find((e) => e.id === id);
            await updateAndRender();
          })
        );
      },
    });
  };

  return { open };
}
