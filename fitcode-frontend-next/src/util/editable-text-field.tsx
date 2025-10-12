import { TextField, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

export interface EditableTextFieldProps {
  value: string;
  onChange?: (newValue: string) => void | Promise<void>;
  fontWeight?: number;
  fontSize?: number;
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
  placeholder?: string;
  autoFocus?: boolean;
  sx?: object;
}

export default function EditableTextField({
  value: propValue,
  onChange,
  fontWeight = 600,
  fontSize = 16,
  textTransform = 'none',
  placeholder = 'Click to edit',
  autoFocus = false,
  sx = {},
}: EditableTextFieldProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(propValue);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setValue(propValue);
  }, [propValue]);

  useEffect(() => {
    if (!editing) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setValue(propValue); // discard edits
        setEditing(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editing, propValue]);

  const handleClick = () => setEditing(true);
  const handleBlur = async () => {
    setEditing(false);
    const trimmed = value.trim();
    if (trimmed && trimmed !== propValue) await onChange?.(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
    } else if (e.key === 'Escape') {
      setValue(propValue);
      setEditing(false);
    }
  };

  return editing ? (
    <TextField
      value={value}
      inputRef={inputRef}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      size="small"
      autoFocus={autoFocus}
      sx={{
        '& input': {
          fontWeight,
          fontSize,
          textTransform,
        },
        ...sx,
      }}
    />
  ) : (
    <Typography
      fontWeight={fontWeight}
      fontSize={fontSize}
      sx={{ textTransform, cursor: 'pointer', ...sx }}
      onClick={handleClick}
    >
      {propValue || placeholder}
    </Typography>
  );
}
