import { Typography } from '@mui/material';

interface Props {
  value: number | string | null;
}

export default function ExerciseParamValueText(props: Props) {
  const { value } = props;

  return (
    <Typography
      textAlign="center"
      fontSize={14}
      fontWeight={500}
      sx={{
        px: 1,
      }}
    >
      {value}
    </Typography>
  );
}
