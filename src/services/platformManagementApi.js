import api from "./api";
import { appSlug } from "../config";

const appContextPath = `/v1/apps/${encodeURIComponent(appSlug)}`;

const asArray = (value) => (Array.isArray(value) ? value : []);

export async function getAccountContext(options = {}) {
  const { data } = await api.get(`${appContextPath}/me`, options);
  return data?.data || {};
}

export async function listManagedEstablishments(options = {}) {
  const { data } = await api.get(`${appContextPath}/me/establishments`, options);
  return asArray(data?.data);
}

export async function findManagedEstablishmentBySlug(slug, options = {}) {
  if (!slug) return null;
  const establishments = await listManagedEstablishments(options);
  return (
    establishments.find(
      (establishment) => String(establishment?.slug || "") === String(slug)
    ) || null
  );
}

export async function listManagedItems(establishmentId, options = {}) {
  if (!establishmentId) return [];
  const { data } = await api.get(
    `${appContextPath}/establishments/${Number(establishmentId)}/items`,
    options
  );
  return asArray(data?.data);
}

export async function deleteManagedItem(itemId) {
  if (!itemId) throw new Error("Item não informado.");
  const { data } = await api.delete(`${appContextPath}/items/${Number(itemId)}`);
  return data;
}

export async function listEstablishmentAppointments(slug, options = {}) {
  const { data } = await api.get(
    `${appContextPath}/establishments/${encodeURIComponent(slug)}/appointments`,
    options
  );
  return data || {};
}

export async function transitionAppointment(orderId, action, reason = null) {
  const { data } = await api.patch(
    `${appContextPath}/appointments/${Number(orderId)}/transition`,
    { action, reason }
  );
  return data || {};
}

export async function assignAppointment(orderId, attendantId) {
  const { data } = await api.patch(
    `${appContextPath}/appointments/${Number(orderId)}/assign`,
    { attendant_id: Number(attendantId) }
  );
  return data || {};
}

export async function getAppointmentDashboard(slug, options = {}) {
  const { data } = await api.get(
    `${appContextPath}/establishments/${encodeURIComponent(slug)}/appointment-dashboard`,
    options
  );
  return data || {};
}

export async function listTeamMembers(establishmentId, options = {}) {
  const { data } = await api.get(`${appContextPath}/team-members`, {
    ...options,
    params: {
      ...(options.params || {}),
      establishment_id: Number(establishmentId),
    },
  });
  return asArray(data?.data);
}

export async function removeTeamMember(teamMemberId) {
  const { data } = await api.delete(
    `${appContextPath}/team-members/${Number(teamMemberId)}`
  );
  return data;
}

export { appContextPath };
