import { useCallback, useEffect, useState } from 'react';

import { BACKEND_API_BASE_URL } from '../constant/api.constant';
import { useAuthenticatedAuth } from '@/store/auth-provider';

export function useNestBackendFetch<T = unknown>(
  url: string,
  options?: { enabled?: boolean }
) {
  const { token } = useAuthenticatedAuth();

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_API_BASE_URL}${url}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);

      const result: T = await response.json();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [url, token]);

  useEffect(() => {
    if (options?.enabled && url) fetchData();
  }, [fetchData, options?.enabled]);

  return { data, setData, error, loading, refetch: fetchData };
}
