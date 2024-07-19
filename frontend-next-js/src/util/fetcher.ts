import { BASE_URL } from '@/constant/api';

interface FetcherOptions {
  method?: string;
  token?: string;
  body?: object;
}

export async function fetcher<T>(url: string, options: FetcherOptions): Promise<T> {
  const { method = 'GET', token, body } = options;
  const res = await fetch(`${BASE_URL}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'An error occurred');
  }

  return res.json();
}