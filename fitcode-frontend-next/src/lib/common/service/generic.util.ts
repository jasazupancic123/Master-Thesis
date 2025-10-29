import type { PaginateOptions } from '@/lib/common/type/paginate.type';

export class GenericUtil {
  sleep(s: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, s * 1000));
  }

  paginate<T>(data: T[], options: PaginateOptions<T> = {}): T[] {
    const { page = 1, pageSize = 10 } = options;
    const start = (page - 1) * pageSize;
    const end = page * pageSize;
    return data.slice(start, end);
  }

  async optimisticUpdate<T, U>(
    apply: () => void, // called before async operation (optimistic UI update)
    rollback: (snapshot: T, e: Error) => void, // restores old state on failure
    action: () => Promise<U>, // async function (API call)
    snapshot: T, // previous state snapshot
    postAction?: (result: U) => void // optional function called after successful action
  ): Promise<U> {
    apply();

    try {
      const result = await action();
      if (postAction) postAction(result);
      return result;
    } catch (e) {
      console.error('Optimistic update failed:', e);
      rollback(snapshot, e as Error);
      throw e; // rethrow for optional handling by caller
    }
  }
}
