import Box from '@mui/material/Box';
import React from 'react';

export default function BorderColor(props: { color: string, lower?: boolean, width?: string | number }) {
  if (props.lower)
    return <Box
      sx={{
        height: 6,
        borderBottomRightRadius: 25,
        borderBottomLeftRadius: 25,
        backgroundColor: props.color,
        width: props.width,
      }}
    />;

  return <Box
    sx={{
      height: 6,
      borderTopRightRadius: 25,
      marginBottom: '5px',
      borderTopLeftRadius: 25,
      backgroundColor: props.color,
      width: props.width,
    }}
  />;
}