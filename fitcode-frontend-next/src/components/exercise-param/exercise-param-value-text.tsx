import { Typography } from '@mui/material';

import { theme } from '@/app/style';
import { STRING_CONST } from '@/lib/common/const/string.const';

interface Props {
  value: number | string | null;
  secondary?: boolean;
}

export default function ExerciseParamValueText(props: Props) {
  const { value, secondary } = props;

  const isDoIt = value === STRING_CONST.doIt;

  return (
    <Typography
      noWrap={isDoIt}
      textAlign="center"
      fontSize={secondary ? 14 : 26}
      lineHeight={!secondary ? 1.2 : undefined}
      fontWeight={600}
      sx={{
        color: isDoIt
          ? theme.palette.primary.main
          : secondary
            ? theme.palette.background.lightBorder
            : undefined,
        px: 1,
      }}
    >
      {value}
    </Typography>
  );
}
