import Box from '@mui/material/Box';
import React from 'react';

export default function BorderColor(props: {
  color: string;
  lower?: boolean;
  width?: string | number;
  onClick?: () => void;
  applyMargin?: boolean;
  marginValue?: string | number;
}) {
  const height = 3;
  if (props.lower)
    return (
      <Box
        sx={{
          height,
          borderBottomRightRadius: 25,
          borderBottomLeftRadius: 25,
          backgroundColor: props.color,
          marginTop: props.applyMargin ? props.marginValue : undefined,
          width: props.width,
        }}
      />
    );

  return (
    <Box
      sx={{
        height,
        borderTopRightRadius: 25,
        borderTopLeftRadius: 25,
        backgroundColor: props.color,
        marginBottom: props.applyMargin ? props.marginValue : undefined,
        width: props.width,
      }}
    />
  );
}
