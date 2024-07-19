import { useState, useEffect, useCallback } from 'react';
import { FIREBASE_COOKIE_NAME } from '@/constant/cookies';
import { useLocalStorage } from 'usehooks-ts';
import { BASE_URL } from '@/constant/api';

interface UseFetchOptions<T> {
  method?: string;
  authorization?: boolean;
  body?: object;
  populate?: (data: T) => T & { [key: string]: any };
}

export function useFetch<T = any>(url: string, options?: UseFetchOptions<T>) {
  const {
    method = 'GET',
    authorization = true,
    body,
    populate,
  } = options || {};

  const [data, setData] = useState<T>(null);
  const [error, setError] = useState<Error>(null);
  const [loading, setLoading] = useState(true);
  const [token] = useLocalStorage(FIREBASE_COOKIE_NAME, '');

  const fetchData = useCallback(async () => {
    if (authorization && !token) return;

    setLoading(true);
    const headers = {};

    // Add authorization header if `authorization` is true
    if (authorization)
      headers['Authorization'] = `Bearer ${token}`;

    try {
      const response = await fetch(`${BASE_URL}${url}`, {
        method,
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok)
        throw new Error(response.statusText);

      const result = await response.json();
      setData(populate ? populate(result) : result);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [url, method, authorization, body, token]);

  useEffect(() => {
    fetchData().then();
  }, [token]);

  return [data, loading, error, fetchData, setData] as const;
}