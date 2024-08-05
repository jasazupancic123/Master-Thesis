'use client'

import { ButtonGroup } from '@mui/material';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import React, { useEffect, useState } from 'react';
import { Training } from '@/type/training.type';
import { Dayjs } from 'dayjs';
import qs from 'qs';
import { fetcher } from '@/util/fetcher';
import toast from 'react-hot-toast';
import { PageProps } from '@/app/cycles/[id]/page-props.type';
import { Cycle } from '@/type/cycle.type';
import { AppContextType, useAppContext } from '@/context/app-provider';
import { useRouter } from 'next/navigation';
import { Firestore } from '@/util/firebase';

type Filter = 'year' | 'cycle' | 'week' | 'day';

interface Day {
  startDate: Dayjs;
  endDate: Dayjs;
  isCustom: boolean;
}

interface Props {
  initialFilter: Filter;
  cycle: Cycle;
  trainings: Training[];
  setTrainings: (trainings: Training[]) => void;
  date: Day;
  setDate: (date: Day) => void;
}

export default function DateButtonGroup(props: Props) {
  const { token } = useAppContext() as AppContextType;
  const router = useRouter();

  const { cycle, setTrainings, date, setDate } = props;
  const [filter, setFilter] = useState<Filter>(props.initialFilter);

  useEffect(() => {
    async function fetchTrainings() {
      try {
        let startDate: Dayjs
        let endDate: Dayjs

        switch (filter) {
          case 'year':
            startDate = date.startDate.startOf('year')
            endDate = date.endDate.endOf('year')
            break
          case 'cycle':
            startDate = cycle.startDate.startOf('day')
            endDate = cycle.endDate.endOf('day')
            break
          case 'week':
            startDate = date.startDate.startOf('week')
            endDate = date.endDate.endOf('week')
            break
          case 'day':
            startDate = date.startDate.startOf('day')
            endDate = date.endDate.endOf('day')
            break
        }

        if (date.isCustom) {
          startDate = date.startDate
          endDate = date.endDate
        }

        const query = qs.stringify({
          cycleId: cycle.id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

        const data = await fetcher<Training[]>(`/training?${query}`, { token });
        setTrainings(data.map(item => Firestore.populateTraining(item)));
      } catch (e) {
        console.error(e);
        toast.error(e.message || 'Failed to fetch trainings');
      }
    }

    fetchTrainings().then();
  }, [date]);

  function handleFilter(filter: PageProps['filter']) {
    setFilter(filter);
    setDate({
      startDate: date.startDate,
      endDate: date.endDate,
      isCustom: false,
    });

    router.push(`/cycles/${cycle.id}/${filter}`);
  }

  return <Box mt={20} mx='auto' display='flex' justifyContent='center'>
    <ButtonGroup variant="contained" aria-label="Basic button group">
      <Button onClick={() => handleFilter('year')}>Year</Button>
      <Button onClick={() => handleFilter('cycle')}>Cycle</Button>
      <Button onClick={() => handleFilter('week')}>Week</Button>
      <Button onClick={() => handleFilter('day')}>Day</Button>
    </ButtonGroup>
  </Box>
}