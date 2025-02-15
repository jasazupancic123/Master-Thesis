import toast from 'react-hot-toast';
import { REDIRECT_TO_SIGN_IN } from '../error/redirect.error';
import { LINK_SIGN_IN } from '../constant/navigation.constant';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export type SetState<T = any> = (
  state: T | ((state: T) => T)
) => void | Promise<void>;

export async function handleApiRequest<T>(
  apiCall: () => Promise<T>,
  onSuccess: (data: T) => T | void | undefined,
  onError?: (e: any) => void,
  router?: AppRouterInstance,
  errorMessage = 'Something went wrong'
) {
  try {
    const response = await apiCall();
    onSuccess(response);
    return response;
  } catch (e: any) {
    console.error(e);
    toast.error(e.message || errorMessage);
    if (onError) onError(e);
    if (router)
      if (e.message === REDIRECT_TO_SIGN_IN) router.push(LINK_SIGN_IN.href);
  }
}
