import axios from "axios";

const API_BASE = "/api/ibps";
const client = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

export const metaApi = {
  get: () => client.get("/meta").then((r) => r.data),
};

export const questionsApi = {
  list: (params) => client.get("/questions", { params }).then((r) => r.data),
  get: (id) => client.get(`/questions/${id}`).then((r) => r.data),
  create: (data) => client.post("/questions", data).then((r) => r.data),
  update: (id, data) => client.put(`/questions/${id}`, data).then((r) => r.data),
  remove: (id) => client.delete(`/questions/${id}`).then((r) => r.data),
  bulkCreate: (rows) => client.post("/questions/bulk-create", rows).then((r) => r.data),
  bulkDelete: (ids) => client.post("/questions/bulk-delete", { ids }).then((r) => r.data),
};

export const practiceApi = {
  next: (params) => client.get("/practice/next", { params }).then((r) => r.data),
  submit: (data) => client.post("/practice/submit", data).then((r) => r.data),
};

export const mocksApi = {
  list: () => client.get("/mocks").then((r) => r.data),
  create: (data) => client.post("/mocks", data).then((r) => r.data),
  get: (id) => client.get(`/mocks/${id}`).then((r) => r.data),
  start: (id) => client.post(`/mocks/${id}/start`).then((r) => r.data),
  submitSection: (id, data) =>
    client.post(`/mocks/${id}/submit-section`, data).then((r) => r.data),
  finish: (id) => client.post(`/mocks/${id}/finish`).then((r) => r.data),
  result: (id) => client.get(`/mocks/${id}/result`).then((r) => r.data),
  results: () => client.get("/mocks/results").then((r) => r.data),
  logExternal: (data) => client.post("/mocks/external", data).then((r) => r.data),
};

export const analyticsApi = {
  dashboard: () => client.get("/analytics/dashboard").then((r) => r.data),
};

export const coverageApi = {
  get: () => client.get("/coverage").then((r) => r.data),
  update: (section, topic, data) =>
    client.put("/coverage", { section, topic, ...data }).then((r) => r.data),
  summary: () => client.get("/coverage/summary").then((r) => r.data),
};

export const settingsApi = {
  get: () => client.get("/settings").then((r) => r.data),
  update: (data) => client.put("/settings", data).then((r) => r.data),
};
