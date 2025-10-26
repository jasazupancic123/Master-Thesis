import { Box, Typography } from '@mui/material';

import AthleteWellnessSlider from './athlete-wellness-slider';
import type { SetState } from '@/lib/common/type/state.type';

interface Props {
  label: string;
  value: number;
  setValue: SetState<number>;
  disabled: boolean;
  icon: React.ReactNode;
}

export default function UserWellnessSlider({
  label,
  value,
  setValue,
  disabled,
  icon,
}: Props) {
  return (
    <Box
      width="100%"
      display="flex"
      justifyContent="center"
      alignItems="center"
      sx={{ p: 4, position: 'relative' }}
    >
      <Typography
        fontSize={12}
        gap={0.5}
        sx={{
          position: 'absolute',
          left: 32,
          top: 10,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {icon}
        {label}
      </Typography>

      <AthleteWellnessSlider
        value={value}
        setValue={setValue}
        disabled={disabled}
      />
    </Box>
  );
}
