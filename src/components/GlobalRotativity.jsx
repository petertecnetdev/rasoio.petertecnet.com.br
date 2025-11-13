import React from "react";
import PropTypes from "prop-types";
import { Card } from "react-bootstrap";
import GlobalCarousel from "./GlobalCarousel";
import useImageUtils from "../hooks/useImageUtils";
import "./GlobalRotativity.css";

export default function GlobalRotativity({
  otherEstablishments = [],
  otherEmployers = [],
  otherItems = [],
  navigate,
  openSchedulePopup,
  fmtBRL,
}) {
  const { imageUrl } = useImageUtils("/images/logo.png");

  const valid = (v) => v && v !== "null" && v !== "undefined";

  // ========== ESTABLISHMENTS ==========
  const ests =
    Array.isArray(otherEstablishments) && otherEstablishments.length
      ? otherEstablishments.slice(0, 6).map((e) => ({
          id: e.id,
          name: e.name,
          slug: e.slug,
          type: "establishment",

          // 🔥 GlobalCard espera "logo"
          logo: valid(e.logo) ? e.logo : null,
          background: valid(e.background) ? e.background : null,

          total_views: e.total_views || 0,
          completed_appointments: e.completed_appointments || 0,
        }))
      : [];

  // ========== EMPLOYERS ==========
  const emps =
    Array.isArray(otherEmployers) && otherEmployers.length
      ? otherEmployers.slice(0, 6).map((emp) => {
          const u = emp.user || {};
          return {
            id: emp.id,
            name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || "Colaborador",
            slug: u.user_name,
            type: "employer",

            // 🔥 GlobalCard espera item.user.avatar
            user: {
              avatar: valid(u.avatar) ? u.avatar : null,
              first_name: u.first_name,
              last_name: u.last_name,
              user_name: u.user_name,
            },

            total_views: emp.total_views || 0,
            completed_appointments: emp.completed_appointments || 0,
          };
        })
      : [];

  // ========== ITEMS ==========
  const items =
    Array.isArray(otherItems) && otherItems.length
      ? otherItems.slice(0, 6).map((i) => ({
          id: i.id,
          name: i.name,
          slug: i.slug,
          price: i.price || 0,
          type: i.type || "service",

          // 🔥 GlobalCard espera "image"
          image: valid(i.image) ? i.image : null,

          // 🔥 Precisa entity para mostrar logo do estabelecimento
          entity: i.entity
            ? {
                name: i.entity.name,
                slug: i.entity.slug,
                logo: valid(i.entity.logo) ? i.entity.logo : null,
                background: valid(i.entity.background) ? i.entity.background : null,
              }
            : null,

          total_views: i.total_views || 0,
          completed_appointments: i.completed_appointments || 0,
        }))
      : [];

  if (!ests.length && !emps.length && !items.length) return null;

  return (
    <div className="global-rotativity mt-4">
      <Card className="rotativity-card p-3 bg-dark text-light border-0 shadow-sm">
        <h4 className="mb-3 text-center text-info">Descubra Mais</h4>

        {ests.length > 0 && (
          <div className="mb-4">
            <GlobalCarousel
              title="Outros Estabelecimentos"
              items={ests}
              navigate={navigate}
              showSchedule={false}
              openSchedulePopup={() => {}}
              fmtBRL={fmtBRL}
            />
          </div>
        )}

        {emps.length > 0 && (
          <div className="mb-4">
            <GlobalCarousel
              title="Outros Colaboradores"
              items={emps}
              navigate={navigate}
              showSchedule={false}
              openSchedulePopup={() => {}}
              fmtBRL={fmtBRL}
            />
          </div>
        )}

        {items.length > 0 && (
          <div className="mb-4">
            <GlobalCarousel
              title="Outros Itens"
              items={items}
              navigate={navigate}
              showSchedule={false}
              openSchedulePopup={() => {}}
              fmtBRL={fmtBRL}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

GlobalRotativity.propTypes = {
  otherEstablishments: PropTypes.array,
  otherEmployers: PropTypes.array,
  otherItems: PropTypes.array,
  navigate: PropTypes.func.isRequired,
  openSchedulePopup: PropTypes.func,
  fmtBRL: PropTypes.func,
};
