// lib/api/fetch-client.ts
import { useState, useCallback } from "react";

const BASE_URL = "http://localhost:8000"; 

export const useFetch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(
    async (endpoint: string, method: string, body?: any, token?: string) => {
      setLoading(true);
      setError(null);
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(`${BASE_URL}${endpoint}`, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const msg = data.error || data.message || "Request failed";
          throw new Error(msg);
        }

        return data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getData = useCallback(
    (endpoint: string, token?: string) => request(endpoint, "GET", undefined, token),
    [request]
  );

  const postData = useCallback(
    (endpoint: string, body?: any, token?: string) => request(endpoint, "POST", body, token),
    [request]
  );

  const patchData = useCallback(
    (endpoint: string, body?: any, token?: string) => request(endpoint, "PATCH", body, token),
    [request]
  );

  const putData = useCallback(
    (endpoint: string, body?: any, token?: string) => request(endpoint, "PUT", body, token),
    [request]
  );

  const deleteData = useCallback(
    (endpoint: string, body?: any, token?: string) => request(endpoint, "DELETE", body, token),
    [request]
  );

  return { loading, error, getData, postData, patchData, putData, deleteData };
};