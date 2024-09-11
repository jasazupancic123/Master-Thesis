import qs from 'qs';
import { BASE_URL } from '@/common/constant/api.constant';
import { FetchOptions } from '@/common/type/api.type';

export class ApiUtil {
  static query(query?: Record<string, string | number | (string | number)[]>) {
    return query ? `?${qs.stringify(query)}` : '';
  }

  query(query?: Record<string, string | number | (string | number)[]>) {
    return query ? `?${qs.stringify(query)}` : '';
  }

  async fetch<T>(url: string, options?: FetchOptions): Promise<T> {
    const { method = 'GET', token, body, query, formData } = options || {};

    const res = await fetch(`${BASE_URL}${url}${this.query(query)}`, {
      method,
      headers: {
        ...(!formData ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      ...(formData ? { body: formData } : {}),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'An error occurred');
    }

    return res.json();
  }
}