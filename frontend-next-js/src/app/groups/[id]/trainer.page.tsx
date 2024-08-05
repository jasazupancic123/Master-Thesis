'use client'

import Typography from '@mui/material/Typography';
import GroupMembersStack from '@/component/group-members-stack';
import { Props } from './props.type';
import AddIcon from '@mui/icons-material/AddOutlined';
import IconButton from '@mui/material/IconButton';
import { useEffect, useState } from 'react';
import MyModal from '@/component/modal';
import { CreateCycle, Cycle } from '@/type/cycle.type';
import { addDays } from 'date-fns';
import Grid from '@mui/material/Unstable_Grid2';
import { DatePicker, LocalizationProvider, PickerValidDate } from '@mui/x-date-pickers';
import { Card, CardContent, TextField } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import toast from 'react-hot-toast';
import { fetcher } from '@/util/fetcher';
import { AppContextType, useAppContext } from '@/context/app-provider';
import { useFetch } from '@/hook/use-fetch';
import CycleGrid from '@/component/cycle-grid';
import { Firestore } from '@/util/firebase';
import { useRouter } from 'next/navigation';

export default function TrainerPage(props: Props) {
  // context
  const { group } = props;
  const {token} = useAppContext() as AppContextType;
  const router = useRouter()

  // cycles
  const [cycles, loading, error, refetch, setCycles] = useFetch<Cycle[]>(`/cycle/${group.id}`, {
    populate: (data) => data.map(item => Firestore.populateCycle(item)),
  });

  // create cycle
  const [modal, setModal] = useState({ cycle: false });
  const [cycle, setCycle] = useState<CreateCycle>({
    name: 'Cycle A',
    startDate: dayjs(),
    endDate: dayjs(addDays(new Date(), 14)),
  });

  // create cycle
  async function createCycle(cycle: CreateCycle) {
    const body = {
      name: cycle.name,
      startDate: cycle.startDate.toISOString(),
      endDate: cycle.endDate.toISOString(),
      groupId: group.id,
    }

    try {
      const cycle = await fetcher<Cycle>('/cycle', { method: 'POST', token, body });
      toast.success('Successfully created cycle');
      setCycles([...cycles, Firestore.populateCycle(cycle)]);
    } catch (e) {
      toast.error(e.message || 'Failed to create cycle');
    }
  }

  return <>
    <Typography variant="h3" mb={5}>
      {group.name}
    </Typography>

    <GroupMembersStack
      group={group}
      onClick={(member) => {
        console.log('member:', member);
      }}
    />

    {/* Create cycle button */}
    <IconButton onClick={() => setModal({ ...modal, cycle: true })}>
      <AddIcon />
    </IconButton>

    {/* Cycles card grid */}
    <Typography variant="h5" mt={5} mb={2}>
      Cycles
    </Typography>

    <Grid container spacing={2} mb={5}>
      {cycles && cycles.map((cycle) => (
        <Grid xs={12} sm={6} md={4} lg={3} key={cycle.id}>
          <Card>
            <CardContent>
              <Typography variant="h6">
                {cycle.name}
              </Typography>

              <Typography>
                {cycle.startDate.format('MMM DD, YYYY')} - {cycle.endDate.format('MMM DD, YYYY')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>

    {/* Cycles grid */}
    {loading
      ? <Typography>Loading cycles...</Typography>
      : error
        ? <Typography>Error loading cycles</Typography>
        : cycles
          ? <CycleGrid cycles={cycles} onClick={(cycle) => router.push(`/cycles/${cycle.id}`)} />
          : null
    }

    {/* Create cycle modal */}
    <LocalizationProvider dateAdapter={AdapterDayjs as any}>
      <MyModal
        isOpen={modal.cycle}
        setIsOpen={(cycle) => setModal({ ...modal, cycle })}
        title="Create Cycle"
        onCancel={() => setModal({ ...modal, cycle: false })}
        onConfirm={async () => await createCycle(cycle)}
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
    </LocalizationProvider>
  </>;
}