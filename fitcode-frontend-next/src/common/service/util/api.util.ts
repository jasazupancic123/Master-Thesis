import qs from 'qs';

import type { FetchOptions, Query } from '@/common/type/api.type';

export class ApiUtil {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  formatQuery(query: Query[string]): string {
    return Array.isArray(query)
      ? query.join(',')
      : query instanceof Date
        ? query.toISOString()
        : (query as unknown as string);
  }

  query(query?: Query) {
    if (!query) return '';

    const formatted: Record<string, string> = {};
    for (const [key, record] of Object.entries(query))
      formatted[key] = this.formatQuery(record);

    return `?${qs.stringify(formatted)}`;
  }

  async fetch<T>(url: string, options?: FetchOptions): Promise<T> {
    const {
      method = 'GET',
      token,
      body,
      query,
      formData,
      cacheTimeInMs,
    } = options || {};

    const res = await fetch(`${this.baseUrl}${url}${this.query(query)}`, {
      method,
      headers: {
        ...(!formData ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      ...(formData ? { body: formData } : {}),
      ...(cacheTimeInMs ? { next: { revalidate: cacheTimeInMs } } : {}),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'An error occurred');
    }

    if (res.status === 204) return undefined as T; // No Content status
    const text = await res.text();
    if (!text) return undefined as T; // Empty response

    return JSON.parse(text) as T;
  }

  async get<T>(
    url: string,
    options?: Pick<FetchOptions, 'token' | 'query' | 'cacheTimeInMs'>
  ): Promise<T> {
    return this.fetch<T>(url, { ...(options || {}), method: 'GET' });
  }

  async post<T>(
    url: string,
    body: object,
    options?: Pick<FetchOptions, 'token' | 'query' | 'formData'>
  ): Promise<T> {
    return await this.fetch<T>(url, {
      ...(options || {}),
      method: 'POST',
      body,
    });
  }

  async patch<T>(
    url: string,
    body: object,
    options?: Pick<FetchOptions, 'token' | 'query' | 'formData'>
  ): Promise<T> {
    return this.fetch<T>(url, { ...(options || {}), method: 'PATCH', body });
  }

  async delete<T>(
    url: string,
    options?: Pick<FetchOptions, 'token' | 'query' | 'body'>
  ): Promise<T> {
    return this.fetch<T>(url, { ...(options || {}), method: 'DELETE' });
  }
}
