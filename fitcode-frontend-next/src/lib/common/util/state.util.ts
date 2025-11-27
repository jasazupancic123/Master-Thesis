import type { Fetch } from '../type/fetch.type';

export function initFetch<T>(defaultValue: T): Fetch<T> {
  return {
    loading: false,
    error: null,
    data: defaultValue,
  };
}

export function settleState<T>(
  result: PromiseSettledResult<T>,
  defaultValue: T
): Fetch<T> {
  return {
    loading: false,
    error: result.status === 'rejected' ? result.reason : null,
    data: result.status === 'fulfilled' ? result.value : defaultValue,
  };
}
