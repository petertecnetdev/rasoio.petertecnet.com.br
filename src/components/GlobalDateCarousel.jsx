import React, { useMemo, useRef } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
import "dayjs/locale/pt-br";
import "./GlobalDateCarousel.css";

dayjs.extend(utc);
dayjs.extend(tz);
dayjs.locale("pt-br");

const TZ = "America/Sao_Paulo";
const DIAS_PT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MESES_PT = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
];

export default function GlobalDateCarousel({
  selectedDate,
  onChange,
  daysToShow = 14,
  availableDates = null,
  loading = false,
}) {
  const trackRef = useRef(null);

  const days = useMemo(() => {
    const hoje = dayjs().tz(TZ).startOf("day");
    const allowed = Array.isArray(availableDates)
      ? new Set(availableDates.map((date) => String(date).slice(0, 10)))
      : null;

    return Array.from({ length: daysToShow }, (_, i) => {
      const d = hoje.add(i, "day");
      return {
        key: d.format("YYYY-MM-DD"),
        week: DIAS_PT[d.day()],
        day: d.date(),
        month: MESES_PT[d.month()],
      };
    }).filter((day) => !allowed || allowed.has(day.key));
  }, [availableDates, daysToShow]);

  const scroll = (direction) => {
    if (!trackRef.current) return;
    const offset = direction === "left" ? -300 : 300;
    trackRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="date-carousel">
        <div className="date-track" style={{ justifyContent: "center" }}>
          <div className="date-item" style={{ cursor: "default", minWidth: 220 }}>
            <div className="date-week">BUSCANDO</div>
            <div className="date-month">datas disponíveis...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!days.length) {
    return (
      <div className="date-carousel">
        <div className="date-track" style={{ justifyContent: "center" }}>
          <div style={{ padding: "18px", textAlign: "center", width: "100%" }}>
            Nenhuma data com horário disponível nos próximos {daysToShow} dias.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="date-carousel">
      <button
        type="button"
        className="date-btn left"
        onClick={() => scroll("left")}
        aria-label="Datas anteriores"
      >
        <FaChevronLeft />
      </button>

      <div className="date-track" ref={trackRef}>
        {days.map((d) => {
          const isActive = selectedDate === d.key;

          return (
            <button
              type="button"
              key={d.key}
              className={`date-item ${isActive ? "active" : ""}`}
              onClick={() => onChange(d.key)}
              aria-pressed={isActive}
            >
              <div className="date-week">{d.week}</div>
              <div className="date-day">{d.day}</div>
              <div className="date-month">{d.month}</div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="date-btn right"
        onClick={() => scroll("right")}
        aria-label="Próximas datas"
      >
        <FaChevronRight />
      </button>
    </div>
  );
}
