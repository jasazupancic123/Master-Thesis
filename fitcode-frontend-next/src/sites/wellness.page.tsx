'use client';

import Box from '@mui/material/Box';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { handleApiRequest } from '@/common/type/state.type';
import UserWellnessForm from '@/components/user-wellness-form/user-wellness-form';
import type { Wellness } from '@/controller/user/type/wellness.type';
import { UserController } from '@/controller/user/user.controller';
import { setCachedWellness } from '@/session-cache/wellness.session-cache';
import { useScreenSize } from '@/store/screen-size-provider';

export type SubmitWellnessInput = Parameters<typeof UserController.saveMeta>[0];

export async function submitWellness(
  input: SubmitWellnessInput,
  state: {
    router: AppRouterInstance;
    setCachedWellness: (wellness: Wellness) => void;
  }
) {
  const { router, setCachedWellness } = state;

  handleApiRequest(
    router,
    () => UserController.saveMeta(input),
    (_wellness) => {
      setCachedWellness(_wellness);
      toast.success('Successfully submitted wellness');
    },
    undefined,
    'Could not submit wellness'
  );
}

export default function WellnessPage() {
  const screenSize = useScreenSize();
  const router = useRouter();

  return (
    <Box height="100%" marginTop={screenSize.isLandscapeMobile ? 1 : 3}>
      <UserWellnessForm
        onSubmit={(data) =>
          submitWellness(
            { date: new Date(), ...data },
            { router, setCachedWellness }
          )
        }
        disabled={false}
        setDisabled={() => {}}
      />
    </Box>
  );
}
