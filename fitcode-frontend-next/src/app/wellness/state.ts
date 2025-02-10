import { handleApiRequest } from '@/common/type/state.type';
import { UserController } from '@/controller/user/user.controller';
import toast from 'react-hot-toast';

export type SubmitWellnessInput = Parameters<typeof UserController.saveMeta>[1];

export async function submitWellness(
  token: string,
  input: SubmitWellnessInput
) {
  handleApiRequest(
    () => UserController.saveMeta(token, input),
    (_wellness) => {
      toast.success('Successfully submitted wellness');
    },
    undefined,
    'Could not submit wellness'
  );
}
