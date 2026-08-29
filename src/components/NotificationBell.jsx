import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaCheckDouble, FaClock, FaExclamationCircle } from "react-icons/fa";

import api from "../services/api";
import "./NotificationBell.css";

const POLL_MS = 5000;

function relativeTime(value) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "agora";

  const diff = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;

  const days = Math.floor(hours / 24);
  return `há ${days} dia${days > 1 ? "s" : ""}`;
}

function normalizeNotifications(data) {
  if (Array.isArray(data?.notifications)) return data.notifications;
  if (Array.isArray(data?.data?.notifications)) return data.data.notifications;
  return [];
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const mountedRef = useRef(true);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const badge = useMemo(() => {
    if (unreadCount <= 0) return null;
    return unreadCount > 99 ? "99+" : String(unreadCount);
  }, [unreadCount]);

  const fetchCount = useCallback(async () => {
    try {
      const { data } = await api.get("/rasoio/notifications/unread-count", { timeout: 8000 });
      if (!mountedRef.current) return;
      setUnreadCount(Number(data?.unread_count || 0));
    } catch {
      // A falha do contador nunca deve bloquear o restante do menu.
    }
  }, []);

  const fetchNotifications = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/rasoio/notifications?limit=20", { timeout: 10000 });
      if (!mountedRef.current) return;
      setNotifications(normalizeNotifications(data));
      setUnreadCount(Number(data?.unread_count || 0));
    } catch (requestError) {
      if (!mountedRef.current) return;
      setError(
        requestError?.response?.data?.message ||
          requestError?.response?.data?.error ||
          "Não foi possível carregar as notificações."
      );
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchCount();

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") fetchCount();
    }, POLL_MS);

    const refreshNow = () => fetchCount();
    window.addEventListener("focus", refreshNow);
    document.addEventListener("visibilitychange", refreshNow);
    window.addEventListener("rasoio:notification-refresh", refreshNow);

    return () => {
      mountedRef.current = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshNow);
      document.removeEventListener("visibilitychange", refreshNow);
      window.removeEventListener("rasoio:notification-refresh", refreshNow);
    };
  }, [fetchCount]);

  useEffect(() => {
    const handleOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const toggle = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) await fetchNotifications(true);
  };

  const openNotification = async (notification) => {
    if (!notification) return;

    if (!notification.read_at) {
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item
        )
      );
      setUnreadCount((current) => Math.max(0, current - 1));

      try {
        await api.patch(`/rasoio/notifications/${notification.id}/read`);
      } catch {
        fetchCount();
      }
    }

    setOpen(false);
    if (notification.reference_url) navigate(notification.reference_url);
  };

  const markAllRead = async () => {
    if (!unreadCount) return;

    setUnreadCount(0);
    setNotifications((current) =>
      current.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() }))
    );

    try {
      await api.patch("/rasoio/notifications/read-all");
    } catch {
      fetchNotifications(false);
    }
  };

  return (
    <div className="notificationBell" ref={rootRef}>
      <button
        type="button"
        className={`notificationBell__button ${open ? "is-open" : ""}`}
        onClick={toggle}
        aria-label={badge ? `${badge} notificações não lidas` : "Notificações"}
        aria-expanded={open}
        title="Notificações"
      >
        <FaBell />
        {badge && <span className="notificationBell__badge">{badge}</span>}
      </button>

      {open && (
        <section className="notificationBell__panel" aria-label="Central de notificações">
          <header className="notificationBell__header">
            <div>
              <strong>Notificações</strong>
              <span>{unreadCount ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}` : "Tudo em dia"}</span>
            </div>
            <button type="button" onClick={markAllRead} disabled={!unreadCount}>
              <FaCheckDouble /> Marcar lidas
            </button>
          </header>

          <div className="notificationBell__list">
            {loading && <div className="notificationBell__state"><FaClock /> Carregando notificações...</div>}

            {!loading && error && (
              <div className="notificationBell__state notificationBell__state--error">
                <FaExclamationCircle />
                <span>{error}</span>
                <button type="button" onClick={() => fetchNotifications(true)}>Tentar novamente</button>
              </div>
            )}

            {!loading && !error && notifications.length === 0 && (
              <div className="notificationBell__state">
                <FaBell />
                <strong>Nenhuma notificação ainda</strong>
                <span>Atualizações de agendamentos aparecerão aqui.</span>
              </div>
            )}

            {!loading && !error && notifications.map((notification) => (
              <button
                type="button"
                key={notification.id}
                className={`notificationBell__item ${notification.read_at ? "is-read" : "is-unread"}`}
                onClick={() => openNotification(notification)}
              >
                <span className="notificationBell__dot" />
                <span className="notificationBell__content">
                  <strong>{notification.title || "Nova notificação"}</strong>
                  {notification.message && <span>{notification.message}</span>}
                  <small>{relativeTime(notification.created_at)}</small>
                </span>
                <span className="notificationBell__arrow">›</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
