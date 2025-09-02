import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingOverlayProps {
  title: string;
}

export default function LoadingOverlay(props: LoadingOverlayProps) {
  const { title } = props;
  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      gap={2}
      sx={{
        zIndex: 130000,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
      }}
    >
      <CircularProgress size={24} />
      <Typography fontSize={20}>{title}</Typography>
    </Box>
  );
}
