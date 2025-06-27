import { Typography } from '@mui/material';
import { useTheme } from '@mui/material';

interface LeftRightExerciseTextProps {
  title: string;
}

export default function LeftRightExerciseText(
  props: LeftRightExerciseTextProps
) {
  const theme = useTheme();
  const { title } = props;
  return (
    <Typography
      variant="h6"
      sx={{
        p: 0,
        m: 0,
        color: theme.palette.background.lightBorder,
        zIndex: 1,
        fontSize: 12,
      }}
    >
      {title}
    </Typography>
  );
}
