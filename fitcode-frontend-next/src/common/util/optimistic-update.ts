// utils/optimisticUpdate.ts
export async function optimisticUpdate<T, U>(
  apply: () => void, // called before async operation (optimistic UI update)
  rollback: (snapshot: T) => void, // restores old state on failure
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
    rollback(snapshot);
    throw e; // rethrow for optional handling by caller
  }
}
