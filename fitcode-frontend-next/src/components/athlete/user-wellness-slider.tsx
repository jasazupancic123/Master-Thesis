import { Box, Typography } from '@mui/material';

import AthleteWellnessSlider from './athlete-wellness-slider';
import type { SetState } from '@/lib/common/type/state.type';

export default function UserWellnessSlider(props: {
  label: string;
  value: number;
  setValue: SetState<number>;
  disabled: boolean;
  icon: React.ReactNode;
}) {
  return (
    <Box
      width="100%"
      display="flex"
      justifyContent="center"
      alignItems="center"
      sx={{
        p: 4,
        position: 'relative',
      }}
    >
      <Typography
        fontSize={12}
        sx={{
          position: 'absolute',
          left: 32,
          top: 10,
          display: 'flex',
          alignItems: 'center',
        }}
        gap={0.5}
      >
        {props.icon}
        {props.label}
      </Typography>
      <AthleteWellnessSlider
        value={props.value}
        setValue={props.setValue}
        disabled={props.disabled}
      />
    </Box>
  );
}
