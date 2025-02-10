import toast from 'react-hot-toast';

export type StateFetchData<T = any> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export type SetState<T = any> = (
  state: T | ((state: T) => T)
) => void | Promise<void>;

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
