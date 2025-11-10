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

  const getEstImage = (logo, bg) =>
    valid(logo)
      ? imageUrl(logo)
      : valid(bg)
      ? imageUrl(bg)
      : "/images/logo.png";

  const getEmployerImage = (emp) => {
    const u = emp.user || {};
    const e = emp.establishment || {};
    if (valid(u.avatar)) return imageUrl(u.avatar);
    if (valid(e.logo)) return imageUrl(e.logo);
    if (valid(e.background)) return imageUrl(e.background);
    return "/images/logo.png";
  };

  const getItemImage = (item) => {
    const ent = item.entity || {};
    if (valid(item.image)) return imageUrl(item.image);
    if (valid(ent.logo)) return imageUrl(ent.logo);
    if (valid(ent.background)) return imageUrl(ent.background);
    return "/images/logo.png";
  };

  const ests =
    Array.isArray(otherEstablishments) && otherEstablishments.length
      ? otherEstablishments.slice(0, 6).map((e) => ({
          id: e.id,
          name: e.name,
          slug: e.slug,
          image: getEstImage(e.logo, e.background),
          total_views: e.total_views || 0,
          completed_appointments: e.completed_appointments || 0, // ✅ novo campo
          type: "establishment",
        }))
      : [];

  const emps =
    Array.isArray(otherEmployers) && otherEmployers.length
      ? otherEmployers.slice(0, 6).map((emp) => {
          const u = emp.user || {};
          return {
            id: emp.id,
            name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || "Colaborador",
            slug: u.user_name,
            image: getEmployerImage(emp),
            total_views: emp.total_views || 0,
            completed_appointments: emp.completed_appointments || 0, // ✅ novo campo
            type: "employer",
          };
        })
      : [];

  const items =
    Array.isArray(otherItems) && otherItems.length
      ? otherItems.slice(0, 6).map((i) => ({
          id: i.id,
          name: i.name,
          slug: i.slug,
          price: i.price,
          type: i.type || "item",
          total_views: i.total_views || 0,
          completed_appointments: i.completed_appointments || 0, // ✅ novo campo
          image: getItemImage(i),
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
