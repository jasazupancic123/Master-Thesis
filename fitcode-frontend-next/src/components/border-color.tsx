import Box from '@mui/material/Box';
import React from 'react';

export default function BorderColor(props: {
  color: string;
  lower?: boolean;
  width?: string | number;
  onClick?: () => void;
  applyMargin?: boolean;
}) {
  if (props.lower)
    return (
      <Box
        sx={{
          height: 6,
          borderBottomRightRadius: 25,
          borderBottomLeftRadius: 25,
          backgroundColor: props.color,
          // marginTop: props.applyMargin ? '5px' : undefined,
          width: props.width,
        }}
      />
    );

  return (
    <Box
      sx={{
        height: 6,
        borderTopRightRadius: 25,
        borderTopLeftRadius: 25,
        backgroundColor: props.color,
        // marginBottom: props.applyMargin ? '5px' : undefined,
        width: props.width,
      }}
    />
  );
}
