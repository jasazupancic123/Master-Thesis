'use client';

import UserWellnessForm from '@/components/user-wellness-form';
import Box from '@mui/material/Box';
import { useScreenSize } from '@/context/screen-size-provider';
import { WellnessPageProps } from './type';
import { submitWellness } from './state';

export default function WellnessPage(props: WellnessPageProps) {
  const { token, wellness } = props;
  const screenSize = useScreenSize();

  return (
    <Box height="100%" marginTop={screenSize.isLandscapeMobile ? 1 : 3}>
      <UserWellnessForm
        initialData={wellness}
        onSubmit={(data) => submitWellness(token, data)}
        disabled={false}
        setDisabled={() => {}}
      />
    </Box>
  );
}
