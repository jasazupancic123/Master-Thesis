'use client';

import UserWellnessForm from '@/components/user-wellness-form/user-wellness-form';
import { useScreenSize } from '@/store/screen-size-provider';
import Box from '@mui/material/Box';
import { useRouter } from 'next/navigation';
import { UserController } from '@/controller/user/user.controller';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { handleApiRequest } from '@/common/type/state.type';
import toast from 'react-hot-toast';
import { Wellness } from '@/controller/user/type/wellness.type';

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

export type WellnessPageProps = {
  token: string;
  wellness: Wellness;
};

export default function WellnessPage(props: WellnessPageProps) {
  const { token, wellness } = props;
  const screenSize = useScreenSize();
  const router = useRouter();

  return (
    <Box height="100%" marginTop={screenSize.isLandscapeMobile ? 1 : 3}>
      <UserWellnessForm
        initialData={wellness}
        onSubmit={(data) =>
          submitWellness(token, { date: new Date(), ...data }, { router })
        }
        disabled={false}
        setDisabled={() => {}}
      />
    </Box>
  );
}
