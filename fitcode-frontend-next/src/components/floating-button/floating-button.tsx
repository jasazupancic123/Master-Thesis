import { SaveAs } from '@mui/icons-material';
import { Box, IconButton, Tooltip } from '@mui/material';

interface FloatingButtonProps {
  label: string;
  onClick: () => void | Promise<void>;
}

export default function FloatingButton(props: FloatingButtonProps) {
  const { label = 'Save', onClick } = props;

  return (
    <Box position="absolute" right={10} top="25%">
      <Tooltip title={label}>
        <IconButton onClick={onClick} sx={{ pr: 1, ml: 2 }}>
          <SaveAs sx={{ mr: 0, cursor: 'pointer' }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
