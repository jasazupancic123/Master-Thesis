'use client';

import { Box, Button, TextField } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useState } from 'react';

import { handleDeleteCycle } from '../trainer-group-year-view/components/multi-cycle-slider/actions/actions-cycle';
import { useRouter } from 'next/navigation';
import { GroupController } from '@/controller/group/group.controller';
import { useGroup } from '@/store/group.provider';
import { useMultiCycleSliderCyclesProvider } from '../trainer-group-year-view/context/cycles.provider';

export default function EditCycleForm() {
  const router = useRouter();

  const groupContext = useGroup();
  const sliderCyclesContext = useMultiCycleSliderCyclesProvider();

  const { editCycle, setEditCycle } = sliderCyclesContext;

  const [cycleName, setCycleName] = useState(editCycle?.name);
  const [startDate, setStartDate] = useState<Dayjs | null>(
    dayjs(editCycle?.from)
  );
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs(editCycle?.to));

  const controller = GroupController.getInstance();

  if (!editCycle) return null;

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
            setEditCycle((prev) =>
              !prev ? prev : { ...prev, name: e.target.value }
            );
          }}
        />
        <DatePicker
          format="DD/MM/YYYY"
          label="Start Date"
          value={startDate}
          onChange={(newValue) => {
            if (!newValue) return;
            setStartDate(newValue);
            setEditCycle((prev) =>
              !prev ? prev : { ...prev, from: newValue?.toDate() }
            );
          }}
        />
        <DatePicker
          format="DD/MM/YYYY"
          label="End Date"
          value={endDate}
          onChange={(newValue) => {
            if (!newValue) return;
            setEndDate(newValue);
            setEditCycle((prev) =>
              !prev ? prev : { ...prev, to: newValue?.toDate() }
            );
          }}
        />

        <Button
          variant="contained"
          color="error"
          onClick={async () => {
            await handleDeleteCycle(
              {
                router,
                controller,
              },
              {
                useGroup: groupContext,
                useSliderCycles: sliderCyclesContext,
              }
            );
          }}
        >
          Delete Cycle
        </Button>
      </Box>
    </LocalizationProvider>
  );
}
