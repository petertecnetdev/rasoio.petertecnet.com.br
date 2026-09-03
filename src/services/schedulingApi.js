import api from "./api";
import { apiV1BaseUrl } from "../config";

const schedulingBase = `${apiV1BaseUrl}/scheduling`;

const schedulingApi = {
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
