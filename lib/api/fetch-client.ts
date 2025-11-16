// lib/api/fetch-client.ts
import { useCallback, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../../constant";

export const useFetch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async ( endpoint: string, method: string, body?: any, requestToken: boolean | string = true) => {
    setLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (requestToken === true) {
        const stored = await AsyncStorage.getItem("access");
        if (stored) headers["Authorization"] = `Bearer ${stored}`;
      } else if (typeof requestToken === "string" && requestToken.length > 0) {
        headers["Authorization"] = `Bearer ${requestToken}`;
      }

      let response = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (response.status === 401 && requestToken === true) {
        const refresh = await AsyncStorage.getItem("refresh");

        if (refresh) {
          const refreshRes = await fetch(`${BASE_URL}/api/user/refresh/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh }),
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            await AsyncStorage.setItem("access", refreshData.access);

            headers["Authorization"] = `Bearer ${refreshData.access}`;
            response = await fetch(`${BASE_URL}${endpoint}`, {
              method,
              headers,
              body: body ? JSON.stringify(body) : undefined,
            });
          }
        }
      }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
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
    (endpoint: string, token?: boolean | string) =>
      request(endpoint, "GET", undefined, token),
    [request]
  );

  const postData = useCallback(
    (endpoint: string, body?: any, token?: boolean | string) =>
      request(endpoint, "POST", body, token),
    [request]
  );

  const patchData = useCallback(
    (endpoint: string, body?: any, token?: boolean | string) =>
      request(endpoint, "PATCH", body, token),
    [request]
  );

  const putData = useCallback(
    (endpoint: string, body?: any, token?: boolean | string) =>
      request(endpoint, "PUT", body, token),
    [request]
  );

  const deleteData = useCallback(
    (endpoint: string, body?: any, token?: boolean | string) =>
      request(endpoint, "DELETE", body, token),
    [request]
  );

  return { loading, error, getData, postData, patchData, putData, deleteData };
};
