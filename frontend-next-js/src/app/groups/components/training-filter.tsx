'use client';

import { FormControl, InputLabel, ToggleButton, ToggleButtonGroup } from '@mui/material';
import Box from '@mui/material/Box';
import React, { useEffect, useState } from 'react';
import { Training } from '@/training/type/training.type';
import dayjs, { Dayjs } from 'dayjs';
import toast from 'react-hot-toast';
import { CreateCycle, Cycle } from '@/group/type/cycle.type';
import { useAppContext } from '@/context/app-provider';
import { ApiUtil } from '@/common/service/util/api.util';
import { useFetch } from '@/hook/use-fetch';
import { useParams, useRouter } from 'next/navigation';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { Group } from '@/group/type/group.type';
import { getWeekDays } from '@/common/service/util/date.util';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/AddOutlined';
import CreateCycleModal from '@/group/components/create-cycle-modal';
import { FirebaseFirestoreUtil } from '@/common/service/util/firebase-firestore.util';
import { AppContextType } from '@/common/type/context.type';

export type TrainingFilter = 'year' | 'cycle' | 'week' | 'day';

interface Day {
  startDate: Dayjs;
  endDate: Dayjs;
  isCustom: boolean;
}

interface Props {
  cycle: Cycle | null;
  trainings: Training[];
  subgroup: Group | null;
  setTrainings: (trainings: Training[]) => void;
  filter: TrainingFilter;
  setFilter: (filter: TrainingFilter) => void;
  date: Day;
  setDate: (date: Day) => void;
  setLoading: (loading: boolean) => void;
}

export function getGroupCycleFilterUrl(groupId: string, cycleId: string | null, filter: TrainingFilter) {
  if (!cycleId) return `/groups/${groupId}`;
  return `/groups/${groupId}/cycles/${cycleId}?filter=${filter}`;
}

export default function TrainingFilter(props: Props) {
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;
  const { token, components } = useAppContext() as AppContextType;
  const { filter, setFilter, cycle, subgroup, setTrainings, date, setDate, setLoading } = props;

  const [groups] = useFetch<Group[]>(ApiUtil.URL.groups());
  const [cycles, _, __, ___, setCycles] = useFetch<Cycle[]>(ApiUtil.URL.cycles({ groupId }));
  const [selected, setSelected] = React.useState({ cycleId: cycle?.id, groupId });

  // create cycle
  const [modal, setModal] = useState({ cycle: false });

  /**
   * Create cycle
   */
  async function createCycle(data: CreateCycle) {
    const body = {
      name: data.name,
      startDate: data.startDate.toISOString(),
      endDate: data.endDate.toISOString(),
      groupId: groupId,
    };

    try {
      const response = await ApiUtil.createCycle(body as Partial<Cycle>, token);
      toast.success('Successfully created cycle');
      setCycles([...cycles, FirebaseFirestoreUtil.populateCycle(response)]);
    } catch (e) {
      toast.error(e.message || 'Failed to create cycle');
    }
  }

  /**
   * Filter trainings based on cycle and date range
   */
  useEffect(() => {
    async function fetchTrainings() {
      setLoading(true);

      try {
        let startDate: Dayjs;
        let endDate: Dayjs;

        switch (filter) {
          case 'year':
            startDate = date.startDate.startOf('year');
            endDate = date.endDate.endOf('year');
            break;
          case 'cycle':
            if (!cycle) {
              const week = getWeekDays();
              startDate = week[0].date.startOf('day');
              endDate = week[6].date.endOf('day');
            } else {
              startDate = dayjs(cycle.startDate).startOf('day');
              endDate = dayjs(cycle.endDate).endOf('day');
            }
            break;
          case 'week':
            startDate = date.startDate.startOf('week');
            endDate = date.endDate.endOf('week');
            break;
          case 'day':
            startDate = date.startDate.startOf('day');
            endDate = date.endDate.endOf('day');
            break;
        }

        if (date.isCustom) {
          startDate = date.startDate;
          endDate = date.endDate;
        }

        if (cycle) {
          const data = await ApiUtil.findAllTrainings(token, {
            cycleId: cycle.id,
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
          });

          setTrainings(data.map(item => FirebaseFirestoreUtil.populateTraining(item, components.flat)));

          // add filter to URL
          router.replace(getGroupCycleFilterUrl(groupId, cycle.id, filter));
        }
      } catch (e) {
        console.error(e);
        toast.error(e.message || 'Failed to fetch trainings');
      } finally {
        setLoading(false);
      }
    }

    fetchTrainings().then();
  }, [date]);

  /**
   * Refetch cycles and trainings when group changes
   */
  useEffect(() => {
    if (!selected.cycleId) {
      router.replace(getGroupCycleFilterUrl(selected.groupId, null, filter));
      return;
    }

    async function fetchCyclesAndTrainings() {
      setLoading(true);

      const isGroupChanged = selected.groupId !== groupId || subgroup?.id;
      const isCycleChanged = selected.cycleId !== cycle?.id;

      // if none of group and cycle are changed, skip fetching
      if (!isGroupChanged && !isCycleChanged)
        return;

      // atleast one of group or cycle is changed
      // - if group is changed, refetch cycles and trainings
      // - if cycle is changed, refetch trainings
      try {
        let cycleId = selected.cycleId;

        // fetch trainings in either case
        let trainings = await ApiUtil.findAllTrainings(token, {
          cycleId,
          startTime: date.startDate.toISOString(),
          endTime: date.endDate.toISOString(),
        });

        trainings = trainings.map(item => FirebaseFirestoreUtil.populateTraining(item, components.flat));
        setTrainings(trainings);

        if (isGroupChanged) {
          let cycles = await ApiUtil.getAllCycles(token, { groupId: selected.groupId });
          cycles = cycles.map(item => FirebaseFirestoreUtil.populateCycle(item));
          setCycles(cycles);

          // select first cycle from the new group
          cycleId = cycles[0]?.id || '';
          setSelected(prev => ({ ...prev, cycleId }));
        }

        // add filter to URL
        router.replace(getGroupCycleFilterUrl(selected.groupId, cycleId!, filter));
      } catch (e) {
        console.error(e);
        toast.error(e.message || 'Failed to fetch cycles');
      } finally {
        setLoading(false);
      }
    }

    fetchCyclesAndTrainings().then();
  }, [selected]);

  function handleFilter(filter: Props['filter']) {
    setFilter(filter);
    setDate({
      startDate: date.startDate,
      endDate: date.endDate,
      isCustom: false,
    });
  }

  return <>
    <Box position="absolute" width="100%" p={1} pt={2}>
      {/* Select group */}
      {groups && <FormControl sx={{ mr: 1 }}>
        <InputLabel id="select-group">Group</InputLabel>
        <Select
          labelId="select-group"
          label="Group"
          value={selected.groupId}
          variant="outlined"
          onChange={(event) => {
            const group = groups.find((group) => group.id === event.target.value);
            setSelected(prev => ({ ...prev, groupId: group.id }));
          }}
        >
          {groups.map((group) => (
            <MenuItem key={group.id} value={group.id}>
              {group.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>}

      {/* Select cycle */}
      {cycle && cycles && <FormControl>
        <InputLabel id="select-cycle">Cycle</InputLabel>
        <Select
          labelId="select-cycle"
          label="Cycle"
          value={selected.cycleId}
          variant="outlined"
          onChange={(event) => {
            const cycle = cycles.find((cycle) => cycle.id === event.target.value);
            setSelected(prev => ({ ...prev, cycleId: cycle.id }));
          }}
        >
          {cycles.map((cycle) => (
            <MenuItem key={cycle.id} value={cycle.id}>
              {cycle.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>}

      {/* Create cycle button */}
      <IconButton onClick={() => setModal({ ...modal, cycleId: true })}>
        <AddIcon />
      </IconButton>
    </Box>

    <Box mx="auto" display="flex" justifyContent="center">
      <ToggleButtonGroup
        value={filter}
        exclusive
        onChange={(event, value) => handleFilter(value as TrainingFilter)}
        sx={{ display: 'flex', borderColor: '#303E4A', borderWidth: 1, borderRadius: 1, pt: 0 }}
      >
        <CustomButton value="year" />
        <CustomButton value="cycle" />
        <CustomButton value="week" />
        <CustomButton value="day" />
      </ToggleButtonGroup>
    </Box>

    <CreateCycleModal
      open={modal.cycle}
      setOpen={(open) => setModal({ ...modal, cycleId: open })}
      onConfirm={(data) => createCycle(data)}
    />
  </>;
}

function CustomButton(props: { value: TrainingFilter }) {
  return <ToggleButton
    value={props.value.toLowerCase()}
    sx={{
      flex: 1,
      color: '#fff',
      backgroundColor: '#303E4A',
      borderColor: '#303E4A',
      borderWidth: 1,
      borderRadius: '0 0 30px 30px',
      '&.Mui-selected': {
        backgroundColor: '#1EB980',
        color: '#fff',
      },
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        color: '#fff',
      },
      textTransform: 'none',
      p: 1,
    }}
  >
    {props.value.toUpperCase()}
  </ToggleButton>;
}