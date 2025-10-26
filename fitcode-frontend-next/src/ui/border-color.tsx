import Box from '@mui/material/Box';
import React from 'react';

interface Props {
  color: string;
  lower?: boolean;
  width?: string | number;
  onClick?: () => void;
  applyMargin?: boolean;
  marginValue?: string | number;
}

export default function BorderColor(props: Props) {
  return props.lower ? (
    <Box
      sx={{
        height: 3,
        borderBottomRightRadius: 25,
        borderBottomLeftRadius: 25,
        backgroundColor: props.color,
        marginTop: props.applyMargin ? props.marginValue : undefined,
        width: props.width,
      }}
    />
  ) : (
    <Box
      sx={{
        height: 3,
        borderTopRightRadius: 25,
        borderTopLeftRadius: 25,
        backgroundColor: props.color,
        marginBottom: props.applyMargin ? props.marginValue : undefined,
        width: props.width,
      }}
    />
  );
}
