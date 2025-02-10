import qs from 'qs';
import { BACKEND_API_BASE_URL } from '@/common/constant/api.constant';
import { FetchOptions, Query } from '@/common/type/api.type';
import { LINK_SIGN_IN } from '@/common/constant/navigation.constant';
import { permanentRedirect, redirect } from 'next/navigation';

export class ApiUtil {
  static formatQuery(query: Query[string]): string {
    return Array.isArray(query)
      ? query.join(',')
      : query instanceof Date
        ? query.toISOString()
        : (query as unknown as string);
  }

  static query(query?: Query) {
    if (!query) return '';

    const formatted: Record<string, string> = {};
    for (const [key, record] of Object.entries(query))
      formatted[key] = this.formatQuery(record);

    return `?${qs.stringify(formatted)}`;
  }

  query(query?: Query) {
    return ApiUtil.query(query);
  }

  async fetch<T>(url: string, options?: FetchOptions): Promise<T> {
    const { method = 'GET', token, body, query, formData } = options || {};

    const res = await fetch(
      `${BACKEND_API_BASE_URL}${url}${this.query(query)}`,
      {
        method,
        headers: {
          ...(!formData ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        ...(formData ? { body: formData } : {}),
      }
    );

    if (!res.ok) {
      const error = await res.json();

      if (error.message === 'Please refresh the page or login again')
        permanentRedirect(LINK_SIGN_IN.href);

      throw new Error(error.message || 'An error occurred');
    }

    return res.json() as T;
  }

  async get<T>(
    url: string,
    options?: Pick<FetchOptions, 'token' | 'query'>
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
