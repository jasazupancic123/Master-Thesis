import type { TooltipProps } from '@mui/material';
import { Fade, Tooltip, tooltipClasses } from '@mui/material';
import React from 'react';

import { theme } from '@/app/style';

interface Props {
  title: string;
  position?: TooltipProps['placement'];
}

export default function TutorialTooltip(
  props: Props & React.PropsWithChildren
) {
  const { title, position = 'top', children } = props;

  return (
    <Tooltip
      title={title}
      placement={position}
      arrow
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 400 }}
      sx={{
        [`& .${tooltipClasses.tooltip}`]: {
          backgroundColor: theme.palette.background.light,
          color: theme.palette.text.primary,
          maxWidth: 220,
          fontSize: 14,
        },
      }}
    >
      <span style={{ display: 'inline-flex' }}>{children}</span>
    </Tooltip>
  );
}
