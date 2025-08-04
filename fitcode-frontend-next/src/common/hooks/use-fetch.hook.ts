import { useCallback, useEffect, useState } from 'react';

import { ApiUtil } from '../service/util/api.util';

type UseFetchOptions = RequestInit & {
  skip?: boolean; // if true, won't auto-fetch
};

export function useFetch<T = unknown>(url: string, options?: UseFetchOptions) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchData = useCallback(
    async (providedUrl?: string) => {
      setLoading(true);
      setError(null);

      try {
        const token = await ApiUtil.getFreshIdToken();
        if (!token) throw new Error('Unauthorized');

        const response = await fetch(providedUrl || url, {
          ...options,
          headers: {
            ...options?.headers,
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result: T = await response.json();
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    },
    [url]
  );

  useEffect(() => {
    if (!options?.skip) fetchData();
  }, [fetchData, options?.skip]);

  return { data, setData, error, loading, refetch: fetchData };
}
