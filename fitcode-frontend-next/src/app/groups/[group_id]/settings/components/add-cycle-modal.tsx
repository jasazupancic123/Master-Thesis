'use client';

import { useState } from 'react';
import { Box, Button, Modal, TextField, Typography } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import toast from 'react-hot-toast';
import { GroupController } from '@/group/group.controller';
import { useGroupSidebar } from '@/context/groups-sidebar-provider';
import { useAppContext } from '@/context/app-provider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { CreateCycle } from '@/group/type/cycle.type';

interface AddCycleModalProps {
  onClose: () => void;
  selected: any;
  setSelected: (selected: any) => void;
}

export default function AddCycleModal(props: AddCycleModalProps) {
  const { token } = useAppContext();
  const [cycleName, setCycleName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);

  const handleAddCycle = async () => {
    try {
      if (!props.selected.group?.id) {
        toast.error('No group selected.');
        return;
      }
    } catch (error) {
      toast.error('No group selected.');
      return;
    }

    if (!cycleName || !startDate || !endDate) {
      toast.error('Please fill in all required fields.');
      return;
    }
    try {
      const start: Date = startDate?.toDate();
      const end: Date = endDate?.toDate();
      if (start > end) {
        toast.error('Start date must be before end date.');
        return;
      }
      const body: CreateCycle = {
        name: cycleName,
        description,
        from: start,
        to: end,
      };
      const newCycle = await GroupController.addCycle(
        token,
        props.selected.group.id,
        body
      );
      console.log('cycles length before', props.selected.group?.cycles.length);
      props.setSelected((prev: any) => {
        if (!prev?.group) return prev; // Safety check
        return {
          ...prev,
          group: {
            ...prev.group,
            cycles: [...(prev.group.cycles || []), newCycle], // Ensure it's always an array
          },
        };
      });

      console.log('cycles length after', props.selected.group?.cycles.length);
      toast.success('Cycle added successfully.');
      props.onClose();
    } catch (error: any) {
      if (error.message?.toLowerCase().includes('overlap')) {
        toast.error('Cycle dates overlap with an existing cycle.');
        return;
      }
      toast.error('Failed to add cycle.');
    }
  };

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
        onClick={handleAddCycle}
      >
        Add Cycle
      </Button>
    </Box>
  );
}
