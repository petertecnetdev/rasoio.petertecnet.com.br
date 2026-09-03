import api from "./api";
import { apiV1BaseUrl } from "../config";

const schedulingBase = `${apiV1BaseUrl}/scheduling`;

const schedulingApi = {
  catalog: {
    businessCategories: () =>
      api.get(`${schedulingBase}/catalog/business-categories`),
    resourceTypes: () => api.get(`${schedulingBase}/catalog/resource-types`),
  },

  professionals: {
    list: (establishmentId) =>
      api.get(`${apiV1BaseUrl}/establishments/${establishmentId}/employers`),
    create: (payload) => api.post(`${apiV1BaseUrl}/employers`, payload),
    remove: (employerId) => api.delete(`${apiV1BaseUrl}/employers/${employerId}`),
    items: (employerId) => api.get(`${apiV1BaseUrl}/employers/${employerId}/items`),
    syncItems: (employerId, itemIds) =>
      api.put(`${apiV1BaseUrl}/employers/${employerId}/items`, { item_ids: itemIds }),
    metrics: (employerId) => api.get(`${apiV1BaseUrl}/employers/${employerId}/metrics`),
  },

  resources: {
    list: (establishmentId) =>
      api.get(`${schedulingBase}/establishments/${establishmentId}/resources`),
    create: (payload) => api.post(`${schedulingBase}/resources`, payload),
    update: (resourceId, payload) =>
      api.patch(`${schedulingBase}/resources/${resourceId}`, payload),
    remove: (resourceId) => api.delete(`${schedulingBase}/resources/${resourceId}`),
    schedules: (resourceId) =>
      api.get(`${schedulingBase}/resources/${resourceId}/schedules`),
    syncSchedules: (resourceId, schedules) =>
      api.put(`${schedulingBase}/resources/${resourceId}/schedules`, { schedules }),
  },

  availability: {
    times: (params) => api.get(`${schedulingBase}/availability/times`, { params }),
    dates: (params) => api.get(`${schedulingBase}/availability/dates`, { params }),
  },

  appointments: {
    create: (payload) => api.post(`${schedulingBase}/appointments`, payload),
    mine: () => api.get(`${schedulingBase}/appointments/mine`),
    provider: () => api.get(`${schedulingBase}/appointments/provider`),
    establishment: (establishmentId) =>
      api.get(`${schedulingBase}/establishments/${establishmentId}/appointments`),
    show: (appointmentId) => api.get(`${schedulingBase}/appointments/${appointmentId}`),
    transition: (appointmentId, payload) =>
      api.patch(`${schedulingBase}/appointments/${appointmentId}/transition`, payload),
    assign: (appointmentId, payload) =>
      api.patch(`${schedulingBase}/appointments/${appointmentId}/assignment`, payload),
  },

  dashboard: (establishmentId) =>
    api.get(`${schedulingBase}/establishments/${establishmentId}/dashboard`),
};

export default schedulingApi;
