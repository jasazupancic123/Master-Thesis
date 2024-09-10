import { DatePicker, LocalizationProvider, PickerValidDate } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import MyModal from '@/common/components/modal';
import Grid from '@mui/material/Unstable_Grid2';
import { TextField } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import { CreateCycle } from '@/group/type/cycle.type';
import { useState } from 'react';
import { addDays } from 'date-fns';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  onConfirm: (data: CreateCycle) => void;
}

export default function CreateCycleModal(props: Props) {
  const { open, setOpen, onConfirm } = props;
  const [cycle, setCycle] = useState<CreateCycle>({
    name: 'Cycle A',
    startDate: dayjs(),
    endDate: dayjs(addDays(new Date(), 14)),
  });

  return <LocalizationProvider dateAdapter={AdapterDayjs as any}>
    <MyModal
      isOpen={open}
      setIsOpen={(isOpen) => setOpen(isOpen)}
      title="Create Cycle"
      onCancel={() => setOpen(false)}
      onConfirm={() => onConfirm(cycle)}
      width={400}
    >
      <Grid container spacing={2} mt={2}>
        <Grid xs={12}>
          <TextField
            fullWidth
            label="Name"
            value={cycle.name}
            onChange={(e) => setCycle({ ...cycle, name: e.target.value })}
          />
        </Grid>

        <Grid xs={6}>
          <DatePicker
            label="Start Date"
            value={cycle.startDate as PickerValidDate}
            onChange={(date) => setCycle({ ...cycle, startDate: date as Dayjs })}
            sx={{ width: '100%' }}
          />
        </Grid>

        <Grid xs={6}>
          <DatePicker
            label="End Date"
            value={cycle.endDate as PickerValidDate}
            onChange={(date) => setCycle({ ...cycle, endDate: date as Dayjs })}
            sx={{ width: '100%' }}
          />
        </Grid>
      </Grid>
    </MyModal>
  </LocalizationProvider>;
}