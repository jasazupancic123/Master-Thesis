import {
  FormControl,
  InputAdornment,
  InputLabel,
  SxProps,
  Theme,
} from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import React, { ReactNode } from 'react';
import { useTheme } from '@mui/material';

interface Props<T> {
  icon: ReactNode;
  label: string;
  value: string | number;
  setValue: (value: string | number) => void;
  items: T[];
  itemKey: keyof T | undefined;
  itemName: keyof T | undefined;
  placeholder?: string;
  disableInputLabel?: boolean;
  enableRemove?: boolean;
  sx?: SxProps<Theme>;
  selectPadding?: string;
  useRenderValue?: boolean;
  displayEmpty?: boolean;
  disabled?: boolean;
  selectSize?: 'small' | 'medium';
  inputLabelSize?: number;
  selectedItemSize?: number;
}

export default function SelectInput<T>(props: Props<T>) {
  const theme = useTheme();
  return (
    <FormControl
      sx={
        props.sx
          ? { ...props.sx, mr: 1, minWidth: 120 }
          : { mr: 1, minWidth: 120 }
      }
    >
      {props.disableInputLabel === true ? (
        <></>
      ) : (
        <InputLabel
          id={`${props.label}-label`}
          sx={{
            fontSize: props.inputLabelSize,
            color: theme.palette.background.dark,
          }}
        >
          {props.label}
        </InputLabel>
      )}

      <Select
        size={props.selectSize ? props.selectSize : undefined}
        variant="outlined"
        label={props.label}
        value={props.value}
        onChange={(e) => props.setValue(e.target.value as string | number)}
        startAdornment={
          <InputAdornment position="start">{props.icon}</InputAdornment>
        }
        displayEmpty={props.displayEmpty}
        disabled={props.disabled}
        renderValue={
          props.useRenderValue
            ? (selected) => {
                if (!selected) {
                  return (
                    <em>{props.placeholder ? props.placeholder : 'None'}</em>
                  );
                }
                const selectedItem = props.items.find((item) =>
                  props.itemKey
                    ? item[props.itemKey] === selected
                    : item === selected
                );
                return selectedItem ? (
                  props.itemName ? (
                    (selectedItem[props.itemName] as unknown as string)
                  ) : (
                    selectedItem.toString()
                  )
                ) : (
                  <em></em>
                );
              }
            : undefined
        }
        sx={{
          '& .MuiSelect-select': {
            p: props.selectPadding ? props.selectPadding : undefined,
          },
          color: '#fff',
          '.MuiOutlinedInput-notchedOutline': { border: 'none' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 'none' },
          '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
          fontSize: props.selectedItemSize,
        }}
      >
        <MenuItem
          value={props.enableRemove ? props.placeholder : ''}
          sx={{ minHeight: 20 }}
        >
          <em>{props.placeholder ? props.placeholder : <>None</>}</em>
        </MenuItem>
        {props.items.map((item, i) => (
          <MenuItem
            key={i}
            value={
              props.itemKey
                ? (item[props.itemKey] as unknown as string)
                : (item as unknown as string)
            }
          >
            {props.itemName
              ? (item[props.itemName] as unknown as string)
              : (item as unknown as string)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
