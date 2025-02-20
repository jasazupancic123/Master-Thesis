'use client';

import { useGroup } from '@/context/group-provider';
import { Box, Button, TextField, Typography } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AddCycleModalProps } from './props';
import { handleAddCycle } from './state';

export default function AddCycleForm(props: AddCycleModalProps) {
  const { onClose } = props;
  const router = useRouter();
  const { token, group, setGroup } = useGroup();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [from, setFrom] = useState<Dayjs>(dayjs().startOf('w'));
  const [to, setTo] = useState<Dayjs>(dayjs().add(1, 'w').endOf('w'));

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      sx={{ p: 2, maxWidth: 350 }}
    >
      <Typography variant="h6" gutterBottom>
        Add New Cycle
      </Typography>

      <TextField
        fullWidth
        label="Cycle Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        sx={{ mt: 2 }}
      />

      <TextField
        fullWidth
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        multiline
        rows={3}
        sx={{ mt: 2 }}
      />

      <Box display="flex" mt={2}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Start Date"
            value={from}
            onChange={(date) => {
              if (date) setFrom(date);
            }}
            sx={{ mr: 1 }}
          />

          <DatePicker
            label="End Date"
            value={to}
            onChange={(date) => {
              if (date) setTo(date);
            }}
            sx={{ ml: 1 }}
          />
        </LocalizationProvider>
      </Box>

      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 3 }}
        onClick={() => {
          handleAddCycle(
            token,
            {
              name: name,
              description,
              from: from?.toDate()!,
              to: to?.toDate()!,
            },
            { router, group, setGroup }
          );
        }}
      >
        Add Cycle
      </Button>
    </Box>
  );
}
