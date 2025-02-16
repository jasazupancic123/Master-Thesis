import { Dispatch, SetStateAction } from 'react';
import toast from 'react-hot-toast';

export type SetState<T = any> = Dispatch<SetStateAction<T>>;
export type SetStateNullable<T = any> = Dispatch<SetStateAction<T | null>>;

export async function handleApiRequest<T>(
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
    toast.error(e.message || errorMessage);
    if (onError) onError(e);
  }
}
