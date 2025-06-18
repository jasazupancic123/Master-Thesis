import { useEffect, useState, useCallback } from 'react';

type UseFetchOptions = RequestInit & {
  skip?: boolean; // if true, won't auto-fetch
};

export function useFetch<T = unknown>(url: string, options?: UseFetchOptions) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, options);
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
  }, [url, JSON.stringify(options)]); // JSON.stringify ensures proper memoization

  useEffect(() => {
    if (!options?.skip) fetchData();
  }, [fetchData]);

  return { data, error, loading, refetch: fetchData };
}
