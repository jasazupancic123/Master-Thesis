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
  inputLabelSize?: number | string;
  selectedItemSize?: number;
  iconSize?: number;
  sameValueAction?: boolean;
  minWidth?: string | number | undefined;
  maxWidth?: string | number;
}

export default function SelectInput<T>(props: Props<T>) {
  const theme = useTheme();
  return (
    <FormControl
      sx={
        props.sx
          ? {
              ...props.sx,
              minWidth: props.minWidth || 120,
              maxWidth: props.maxWidth,
              '& .MuiSelect-icon': {
                fontSize: props.iconSize,
              },
            }
          : {
              minWidth: props.minWidth || 120,
              maxWidth: props.maxWidth,
            }
      }
    >
      {props.disableInputLabel === true ? (
        <></>
      ) : (
        <InputLabel
          id={`${props.label}-label`}
          sx={{
            fontSize: props.inputLabelSize,
            color: theme.palette.background.lightText,
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
        onChange={
          !props.sameValueAction
            ? (e) => props.setValue(e.target.value as string | number)
            : undefined
        }
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
          onClick={props.sameValueAction ? () => props.setValue('') : undefined}
        >
          {props.placeholder ? props.placeholder : <>None</>}
        </MenuItem>
        {props.items.map((item, i) => (
          <MenuItem
            key={i}
            value={
              props.itemKey
                ? (item[props.itemKey] as unknown as string)
                : (item as unknown as string)
            }
            onClick={
              props.sameValueAction
                ? () =>
                    props.setValue(
                      props.itemKey
                        ? (item[props.itemKey] as unknown as string)
                        : (item as unknown as string)
                    )
                : undefined
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
