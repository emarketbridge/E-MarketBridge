import { setBaseUrl } from "@workspace/api-client-react";

/**
 * All REST calls go to the Render API (never the Vercel origin).
 * SPA routes like `/login` stay on the frontend host; only paths starting with `/` passed
 * to the generated client are rewritten here to `VITE_API_URL + path`.
 */
const DEFAULT_API_URL = "https://e-marketbridge.onrender.com";

const raw = import.meta.env.VITE_API_URL;
const envApi = (typeof raw === "string" ? raw : "").trim().replace(/\/+$/, "");
const apiUrl = envApi || DEFAULT_API_URL;

setBaseUrl(apiUrl);

export const API_URL = apiUrl;
