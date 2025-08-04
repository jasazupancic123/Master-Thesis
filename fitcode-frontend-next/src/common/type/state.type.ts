import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { Dispatch, SetStateAction } from 'react';
import toast from 'react-hot-toast';

import { LINK_SIGN_IN } from '../constant/navigation.constant';
import { REDIRECT_TO_SIGN_IN } from '../error/redirect.error';

export type SetState<T> = Dispatch<SetStateAction<T>>;
export type SetStateNullable<T> = Dispatch<SetStateAction<T | undefined>>;

export async function handleApiRequest<T>(
  router: AppRouterInstance,
  apiCall: () => Promise<T>,
  onSuccess: (data: T) => T | void | undefined,
  onError?: (e: unknown) => void,
  errorMessage = 'Something went wrong'
) {
  try {
    const response = await apiCall();
    onSuccess(response);
    return response;
  } catch (e: unknown) {
    console.error(e);
    if (onError) onError(e);

    if (e instanceof Error) {
      if (e.message === REDIRECT_TO_SIGN_IN || e.message === 'NEXT_REDIRECT') {
        router.push(LINK_SIGN_IN.href);
        toast.error('Please sign in again');
        return;
      }

      toast.error(e.message || errorMessage);
    }
  }
}
