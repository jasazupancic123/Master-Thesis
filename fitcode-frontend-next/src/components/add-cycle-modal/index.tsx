'use client';

import dayjs from 'dayjs';
import { useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { AddCycleModalProps } from './type';
import { handleAddCycle } from './state';

export default function AddCycleModal(props: AddCycleModalProps) {
  const { token, onClose, selectedGroup, setSelectedGroup } = props;

  const [cycleName, setCycleName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      sx={{
        p: 2,
        maxWidth: 350,
      }}
    >
      <Typography variant="h6" gutterBottom>
        Add New Cycle
      </Typography>

      <TextField
        fullWidth
        label="Cycle Name"
        value={cycleName}
        onChange={(e) => setCycleName(e.target.value)}
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
            value={startDate}
            onChange={(date) => setStartDate(date)}
            sx={{ mr: 1 }}
          />
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={(date) => setEndDate(date)}
            sx={{ ml: 1 }}
          />
        </LocalizationProvider>
      </Box>

      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 3 }}
        onClick={() =>
          handleAddCycle(
            token,
            cycleName,
            description,
            startDate,
            endDate,
            selectedGroup,
            setSelectedGroup,
            onClose
          )
        }
      >
        Add Cycle
      </Button>
    </Box>
  );
}
