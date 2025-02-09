'use client';

import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';
import { Cycle } from '@/group/entity/cycle.entity';
import { Box, TextField } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

interface EditCycleModalProps {
  onClose: () => void;
  setEditCycle: (cycle: Cycle | null) => void;
  cycle: Cycle | null;
}

export default function EditCycleModal(props: EditCycleModalProps) {
  if (!props.cycle) {
    return <>No cycle selected</>;
  }

  const [cycleName, setCycleName] = useState(props.cycle?.name);
  const [fromDate, setFromDate] = useState<Dayjs | null>(
    dayjs(props.cycle?.from)
  );
  const [toDate, setToDate] = useState<Dayjs | null>(dayjs(props.cycle?.to));

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box display="flex" flexDirection="column" gap={2} mt={2}>
        {/* ✅ Edit Cycle Name */}
        <TextField
          label="Cycle Name"
          variant="outlined"
          fullWidth
          value={cycleName}
          onChange={(e) => {
            setCycleName(e.target.value);
            props.setEditCycle({
              ...props.cycle,
              name: e.target.value,
            } as Cycle);
          }}
        />

        {/* ✅ Date Pickers */}
        <DatePicker
          label="Start Date"
          value={fromDate}
          onChange={(newValue) => {
            if (!newValue) return;
            setFromDate(newValue);
            props.setEditCycle({
              ...props.cycle,
              from: newValue?.toDate(),
            } as Cycle);
          }}
          format="DD/MM/YYYY"
        />
        <DatePicker
          label="End Date"
          value={toDate}
          onChange={(newValue) => {
            if (!newValue) return;
            setToDate(newValue);
            props.setEditCycle({
              ...props.cycle,
              to: newValue?.toDate(),
            } as Cycle);
          }}
          format="DD/MM/YYYY"
        />
      </Box>
    </LocalizationProvider>
  );
}
