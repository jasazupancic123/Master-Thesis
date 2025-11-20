import {
  KeyboardArrowDownOutlined,
  KeyboardArrowUpOutlined,
} from '@mui/icons-material';
import { Avatar, Box, IconButton } from '@mui/material';
import type { JSX, RefObject } from 'react';

import { theme } from '@/app/style';

interface Props {
  anchorElRef: RefObject<HTMLElement | null>;
  src: string | undefined;
  open: boolean;
  onAvatarClick: () => void;
  icon?: JSX.Element;
}

export default function UserSelect(props: Props) {
  const { anchorElRef, src, open, onAvatarClick, icon } = props;

  return (
    <Box
      ref={anchorElRef}
      sx={{
        position: 'relative',
      }}
    >
      <Avatar
        src={src}
        sx={{
          width: 45,
          height: 45,
          cursor: 'pointer',
        }}
        onClick={onAvatarClick}
      >
        {icon}
      </Avatar>
      <IconButton
        sx={{
          p: 0.25,
          m: 0,
          position: 'absolute',
          bottom: -2,
          right: 2,
          zIndex: 10,
          backgroundColor: theme.palette.background.default,
          borderRadius: '50%',
        }}
        onClick={(e) => {
          e.stopPropagation();
          onAvatarClick();
        }}
      >
        {open ? (
          <KeyboardArrowUpOutlined sx={{ fontSize: 16 }} />
        ) : (
          <KeyboardArrowDownOutlined sx={{ fontSize: 16 }} />
        )}
      </IconButton>
    </Box>
  );
}
