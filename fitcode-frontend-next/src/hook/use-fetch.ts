import { useCallback, useEffect, useState } from 'react';
import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { useLocalStorage } from 'usehooks-ts';
import { BACKEND_API_BASE_URL } from '@/common/constant/api.constant';

interface UseFetchOptions {
  method?: string;
  auth?: boolean;
  body?: object;
}

export function useFetch<T>(url: string, options?: UseFetchOptions) {
  const { method = 'GET', auth: auth = true, body } = options || {};

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [token] = useLocalStorage(FIREBASE_COOKIE_NAME, '');

  const fetchData = useCallback(async () => {
    if (auth && !token) return;
    setLoading(true);

    // Add authorization header if `authorization` is true
    const headers = {} as Record<string, string>;
    if (auth) headers['Authorization'] = `Bearer ${token}`;

    try {
      const response = await fetch(`${BACKEND_API_BASE_URL}${url}`, {
        method,
        headers,
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (!response.ok) {
        console.error(result);
        setError(new Error(result.message || 'Failed to fetch data'));
        setLoading(false);
        return;
      }

      setData(result);
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [url, method, auth, body, token]);

  useEffect(() => {
    fetchData().then();
  }, [token, fetchData]);

  return { data, setData, loading, error, fetch: fetchData };
}
