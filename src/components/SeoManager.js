import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://rasoio.petertecnet.com.br";
const DEFAULT_TITLE = "Rasoio | Barbearias, serviços e agendamentos";
const DEFAULT_DESCRIPTION = "Encontre barbearias, profissionais e serviços e faça agendamentos online pela Rasoio, uma plataforma Peter Tecnet.";

const publicRoute = (path) => {
  if (path === "/") return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION };
  if (path === "/search") return { title: "Buscar barbearias e serviços | Rasoio", description: "Pesquise barbearias, profissionais, serviços e produtos disponíveis na Rasoio." };
  if (path === "/establishments") return { title: "Barbearias e estabelecimentos | Rasoio", description: "Descubra estabelecimentos e encontre serviços disponíveis para agendamento na Rasoio." };
  if (path.startsWith("/establishment/view/")) return { title: "Barbearia e serviços | Rasoio", description: "Veja serviços, profissionais e informações deste estabelecimento e faça seu agendamento pela Rasoio." };
  if (path === "/employers") return { title: "Profissionais | Rasoio", description: "Conheça profissionais disponíveis e encontre horários para atendimento na Rasoio." };
  if (path.startsWith("/employer/view/")) return { title: "Profissional | Rasoio", description: "Veja informações e serviços deste profissional na Rasoio." };
  if (path === "/item/services") return { title: "Serviços de barbearia | Rasoio", description: "Encontre serviços publicados por estabelecimentos na Rasoio." };
  if (path === "/item/products") return { title: "Produtos | Rasoio", description: "Conheça produtos publicados por estabelecimentos na Rasoio." };
  if (path.startsWith("/item/view/")) return { title: "Serviço ou produto | Rasoio", description: "Veja detalhes deste serviço ou produto na Rasoio." };
  return null;
};

const PRIVATE_PREFIXES = ["/dashboard", "/orders", "/order/", "/user/", "/item/list/", "/item/create/", "/item/update/", "/employer/list/", "/employer/create/", "/employer/update/", "/employer/dashboard", "/employer/schedules", "/employer/orders", "/establishment/create", "/establishment/update/", "/establishment/my", "/establishment/orders/", "/establishment/item/", "/establishment/employers/", "/login", "/register", "/password", "/email-verify", "/logout", "/invite"];

function meta(selector, attrs) {
  let el = document.head.querySelector(selector);
  if (!el) { el = document.createElement("meta"); document.head.appendChild(el); }
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
}

function canonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) { el = document.createElement("link"); el.rel = "canonical"; document.head.appendChild(el); }
  el.href = href;
}

export default function SeoManager() {
  const location = useLocation();
  useEffect(() => {
    const path = location.pathname.replace(/\/+$/, "") || "/";
    const route = publicRoute(path);
    const indexable = Boolean(route) && !PRIVATE_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix));
    const title = route?.title || DEFAULT_TITLE;
    const description = route?.description || DEFAULT_DESCRIPTION;
    const url = `${SITE_URL}${path === "/" ? "/" : path}`;
    document.title = title;
    meta('meta[name="description"]', { name: "description", content: description });
    meta('meta[name="robots"]', { name: "robots", content: indexable ? "index, follow, max-image-preview:large" : "noindex, nofollow" });
    meta('meta[property="og:title"]', { property: "og:title", content: title });
    meta('meta[property="og:description"]', { property: "og:description", content: description });
    meta('meta[property="og:url"]', { property: "og:url", content: url });
    meta('meta[property="og:type"]', { property: "og:type", content: "website" });
    meta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    canonical(url);
  }, [location.pathname]);
  return null;
}
