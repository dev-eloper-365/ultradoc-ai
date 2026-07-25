import axios from "axios";
import { toast } from "sonner";

import { getSessionId } from "@/lib/session";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/";

export const apiClient = axios.create({ baseURL });

apiClient.interceptors.request.use((config) => {
  const sessionId = getSessionId();
  if (sessionId) config.headers.set("X-Session-Id", sessionId);
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message || error?.message || "Something went wrong";
    toast.error(message);
    return Promise.reject(error);
  },
);
