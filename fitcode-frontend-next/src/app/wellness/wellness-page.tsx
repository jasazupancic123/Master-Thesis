'use client';

import UserWellnessForm from '@/components/user-wellness-form';
import { useScreenSize } from '@/context/screen-size-provider';
import Box from '@mui/material/Box';
import { useRouter } from 'next/navigation';
import { submitWellness } from './state';
import { WellnessPageProps } from './type';

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
