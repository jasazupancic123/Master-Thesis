import * as React from 'react';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { InputAdornment } from '@mui/material';

type Props = TextFieldProps & {
  label?: string;
  children?: React.ReactNode; // icon
}

export default function IconTextField(props: Props) {
  const { children } = props;

  // noinspection TypeScriptValidateTypes
  return (
    <TextField
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            {children ? children : <AccountCircle />}
          </InputAdornment>
        ),
      }}
      variant="standard"
      {...props}
    />
  );
}
