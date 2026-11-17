import axios from "axios";

// Every frontend request uses the PostgreSQL API server and sends its HTTP-only auth cookie.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

export default api;