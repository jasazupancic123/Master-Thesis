import { WarningAmber } from '@mui/icons-material';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';

interface Props {
  title: string;
  topBorder?: boolean;
}

const sx = {
  backgroundColor: '#1A2B3C',
  height: '30px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderTopRightRadius: '0px',
  borderTopLeftRadius: '0px',
  borderBottomRightRadius: '20px',
  borderBottomLeftRadius: '20px',
};

export default function Warning(props: Props) {
  return (
    <Box {...props.topBorder && { sx }}>
      <Stack
        alignItems="center"
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          mt: props.topBorder ? 30 : 4,
          mx: 'auto',
          padding: '20px',
          borderRadius: '12px',
          border: '2px solid red',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
          width: 400,
        }}
      >
        <WarningAmber sx={{ color: 'red', fontSize: '40px', mb: 2 }} />
        <Typography
          variant="body1"
          color="white"
          sx={{ fontStyle: 'italic', fontWeight: 'bold', fontSize: '18px' }}
        >
          {props.title}
        </Typography>
      </Stack>
    </Box>
  );
}