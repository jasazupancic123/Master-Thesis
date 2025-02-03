import { theme } from '@/app/style';
import { Box, Typography } from '@mui/material';
import { Props } from 'next/script';

export default function PageTitle({ title }: Props) {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      pl={3}
      pr={3}
      pt={2}
      minWidth="600px"
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: '0 0 40px 40px',
      }}
    >
      <Typography variant="h4" gutterBottom>
        {title}
      </Typography>
    </Box>
  );
}
