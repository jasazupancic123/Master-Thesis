'use client';

import { SetState } from '@/common/type/state.type';
import { Cycle } from '@/controller/group/type/cycle.type';
import { Box, Button, TextField } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';

export interface EditCycleModalProps {
  selectedCycle: Cycle;
  setSelectedCycle: SetState<Cycle | null>;
  handleDeleteCycle: () => void;
}

export default function EditCycleForm(props: EditCycleModalProps) {
  const { selectedCycle, setSelectedCycle, handleDeleteCycle } = props;

  const [cycleName, setCycleName] = useState(selectedCycle.name);
  const [startDate, setStartDate] = useState<Dayjs | null>(
    dayjs(selectedCycle.from)
  );
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs(selectedCycle.to));

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        display="flex"
        flexDirection="column"
        gap={2}
        mt={2}
        alignItems="center"
      >
        <TextField
          label="Cycle Name"
          variant="outlined"
          fullWidth
          value={cycleName}
          onChange={(e) => {
            setCycleName(e.target.value);
            setSelectedCycle({ ...selectedCycle, name: e.target.value });
          }}
        />
        <DatePicker
          format="DD/MM/YYYY"
          label="Start Date"
          value={startDate}
          onChange={(newValue) => {
            if (!newValue) return;
            setStartDate(newValue);
            setSelectedCycle({
              ...selectedCycle,
              from: newValue?.toDate(),
            });
          }}
        />
        <DatePicker
          format="DD/MM/YYYY"
          label="End Date"
          value={endDate}
          onChange={(newValue) => {
            if (!newValue) return;
            setEndDate(newValue);
            setSelectedCycle({
              ...selectedCycle,
              to: newValue?.toDate(),
            });
          }}
        />

        <Button
          variant="contained"
          color="error"
          onClick={() => {
            handleDeleteCycle();
          }}
        >
          Delete Cycle
        </Button>
      </Box>
    </LocalizationProvider>
  );
}
