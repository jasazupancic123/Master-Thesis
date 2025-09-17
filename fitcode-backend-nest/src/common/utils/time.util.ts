import type { Logger } from '@nestjs/common';

export async function measureAsync<T>(
  label: string,
  fn: () => Promise<T>,
  logger?: Logger,
): Promise<{ result: T; timeMs: number }> {
  const start = Date.now();
  const result = await fn();
  const end = Date.now();

  (logger || console).debug(`[${label}]: Took ${end - start}ms`);
  return { result, timeMs: end - start };
}
