import { Typography } from '@mui/material';

import { theme } from '@/app/style';

interface Props {
  value: number | string | null;
  secondary?: boolean;
}

export default function ExerciseParamValueText(props: Props) {
  const { value, secondary } = props;

  return (
    <Typography
      textAlign="center"
      fontSize={secondary ? 12 : 18}
      fontWeight={600}
      sx={{
        color: secondary ? theme.palette.background.lightBorder : undefined,
        px: 1,
      }}
    >
      {value}
    </Typography>
  );
}
