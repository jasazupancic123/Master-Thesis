import { handleApiRequest } from '@/common/type/state.type';
import { UserController } from '@/controller/user/user.controller';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';

export type SubmitWellnessInput = Parameters<typeof UserController.saveMeta>[1];

export async function submitWellness(
  token: string,
  input: SubmitWellnessInput,
  state: {
    router: AppRouterInstance;
  }
) {
  const { router } = state;

  handleApiRequest(
    router,
    () => UserController.saveMeta(token, input),
    (_wellness) => {
      toast.success('Successfully submitted wellness');
    },
    undefined,
    'Could not submit wellness'
  );
}
