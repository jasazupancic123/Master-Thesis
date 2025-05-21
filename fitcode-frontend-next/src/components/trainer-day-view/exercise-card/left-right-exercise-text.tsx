import { Typography } from "@mui/material";

interface LeftRightExerciseTextProps {
  title: string;
}

export default function LeftRightExerciseText(
  props: LeftRightExerciseTextProps
) {
  const { title } = props;
  return (
    <Typography
      variant="h6"
      sx={{
        p: 0,
        m: 0,
        color: 'white !important',
        zIndex: 1,
        fontSize: 15,
      }}
    >
      {title}
    </Typography>
  );
}
