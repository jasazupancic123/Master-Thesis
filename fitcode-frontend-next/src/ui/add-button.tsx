import { theme } from '@/app/style';
import { Add } from '@mui/icons-material';
import { IconButton, SxProps, Tooltip } from '@mui/material';

interface Props {
  onClick: () => void;
  tooltip?: string;
  sx?: SxProps;
}

export default function AddButton(props: Props) {
  const { onClick, tooltip, sx } = props;

  return (
    <Tooltip title={tooltip}>
      <IconButton
        sx={{
          m: 0,
          p: 0.5,
          backgroundColor: theme.palette.background.light,
          borderRadius: 1,
          ...sx,
        }}
        onClick={onClick}
      >
        <Add fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
