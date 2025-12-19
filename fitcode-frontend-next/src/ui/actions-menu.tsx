import { theme } from '@/app/style';
import { MenuAction } from '@/lib/common/enum/menu-actions.enum';
import { SetState } from '@/lib/common/type/state.type';
import { AddOutlined, DeleteOutlined, EditOutlined } from '@mui/icons-material';
import { Box, IconButton, Menu } from '@mui/material';

interface Props {
  enabledActions: MenuAction[];
  anchorEl: HTMLElement | null;
  setAnchorEl: SetState<HTMLElement | null>;
  onAdd?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function ActionsMenu(props: Props) {
  const { enabledActions, anchorEl, setAnchorEl, onAdd, onEdit, onDelete } =
    props;

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={() => {
        setAnchorEl(null);
      }}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      slotProps={{
        list: {
          sx: {
            backgroundColor: theme.palette.background.dark,
            border: `1px solid ${theme.palette.primary.main}`,
            borderRadius: 2,
            px: 0.5,
          },
        },
      }}
      sx={{
        left: 5,
      }}
    >
      <Box
        width="100%"
        height="100%"
        display="flex"
        flexDirection="column"
        gap={0.5}
      >
        {enabledActions.includes(MenuAction.ADD) && (
          <IconButton
            sx={{ p: 0.5, m: 0 }}
            onClick={() => {
              onAdd && onAdd();
              setAnchorEl(null);
            }}
          >
            <AddOutlined />
          </IconButton>
        )}
        {enabledActions.includes(MenuAction.EDIT) && (
          <IconButton
            sx={{ p: 0.5, m: 0 }}
            onClick={() => {
              onEdit && onEdit();
              setAnchorEl(null);
            }}
          >
            <EditOutlined />
          </IconButton>
        )}
        {enabledActions.includes(MenuAction.DELETE) && (
          <IconButton
            sx={{ p: 0.5, m: 0 }}
            onClick={() => {
              onDelete && onDelete();
              setAnchorEl(null);
            }}
          >
            <DeleteOutlined />
          </IconButton>
        )}
      </Box>
    </Menu>
  );
}
