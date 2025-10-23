import { Typography } from '@mui/material';
import { useTheme } from '@mui/material';

interface Props {
  title: string;
}

export default function LeftRightExerciseText(props: Props) {
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
