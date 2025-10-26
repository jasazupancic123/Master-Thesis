import { Box, Typography } from '@mui/material';

interface TrainingYearCycleComponentSelectItemProps {
  label: string;
}

export default function TrainingYearCycleComponentSelectItem(
  props: TrainingYearCycleComponentSelectItemProps & React.PropsWithChildren
) {
  const { children: selectInput, label } = props;

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      justifyContent="flex-start"
      sx={{
        p: 1,
      }}
    >
      <Typography fontSize={12}>{label}</Typography>
      {selectInput}
    </Box>
  );
}
