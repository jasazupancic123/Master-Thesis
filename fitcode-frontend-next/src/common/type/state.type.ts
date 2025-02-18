import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { Dispatch, SetStateAction } from 'react';
import toast from 'react-hot-toast';
import { LINK_SIGN_IN } from '../constant/navigation.constant';
import { REDIRECT_TO_SIGN_IN } from '../error/redirect.error';

export type SetState<T = any> = Dispatch<SetStateAction<T>>;
export type SetStateNullable<T = any> = Dispatch<SetStateAction<T | undefined>>;

export async function handleApiRequest<T>(
  router: AppRouterInstance,
  apiCall: () => Promise<T>,
  onSuccess: (data: T) => T | void | undefined,
  onError?: (e: any) => void,
  errorMessage = 'Something went wrong'
) {
  try {
    const response = await apiCall();
    onSuccess(response);
    return response;
  } catch (e: any) {
    console.error(e);
    if (onError) onError(e);

    if (e.message === REDIRECT_TO_SIGN_IN || e.message === 'NEXT_REDIRECT')
      router.push(LINK_SIGN_IN.href);

    toast.error(e.message || errorMessage);
  }
}
