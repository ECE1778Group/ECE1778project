// lib/api/fetch-client.ts
import { useState, useCallback } from "react";

const BASE_URL = "http://localhost:8000"; 

export const useFetch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(
    async (endpoint: string, method: string, body?: any) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
          method,
          headers: { "Content-Type": "application/json" },
          body: body ? JSON.stringify(body) : undefined,
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const msg = data.error || data.message || "Request failed";
          throw new Error(msg);
        }

        return data;
      } catch (err: any) {
        console.error("API error:", err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getData = useCallback(
    (endpoint: string) => request(endpoint, "GET"),
    [request]
  );

  const postData = useCallback(
    (endpoint: string, body?: any) => request(endpoint, "POST", body),
    [request]
  );

  const putData = useCallback(
    (endpoint: string, body?: any) => request(endpoint, "PUT", body),
    [request]
  );

  const deleteData = useCallback(
    (endpoint: string, body?: any) => request(endpoint, "DELETE", body),
    [request]
  );

  return { loading, error, getData, postData, putData, deleteData };
};
