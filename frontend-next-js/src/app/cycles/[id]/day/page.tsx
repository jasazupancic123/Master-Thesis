'use client'

import { Props } from '@/type/props.type';
import { AuthContextType, useAuth } from '@/context/auth-provider';
import React, { useState } from 'react';
import { useFetch } from '@/hook/use-fetch';
import { Cycle } from '@/type/cycle.type';
import { Firestore } from '@/util/firebase';
import { Training } from '@/type/training.type';
import dayjs from 'dayjs';
import DateButtonGroup from '@/app/cycles/[id]/date-button-group';
import { UserRole } from '@/enum/user-role.enum';
import TrainerPage from './trainer.page';

export default function Page({ params }: Props) {
  const {role} = useAuth() as AuthContextType
  const [cycle, loading, error, refetch, setCycle] = useFetch<Cycle>(`/cycle/id/${params.id}`, {
    populate: (data) => Firestore.populateCycle(data),
  })

  // filter trainings by date
  // NOTE - trainings are filtered in DateButtonGroup component
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [date, setDate] = useState({
    startDate: dayjs().startOf('day'),
    endDate: dayjs().endOf('day'),
    isCustom: false,
  });

  if (loading)
    return <div>Loading ...</div>

  if (error)
    return <div>Error</div>

  return <>
    {/* Filter trainings */}
    <DateButtonGroup
      initialFilter='day'
      cycle={cycle}
      trainings={trainings}
      setTrainings={setTrainings}
      date={date}
      setDate={setDate}
    />

    {role.includes(UserRole.ATHLETE)
      ? <h1>Athlete Group View</h1>
      : role.includes(UserRole.TRAINER)
        ? <TrainerPage
          cycle={cycle}
          setCycle={setCycle}
          trainings={trainings}
          setTrainings={setTrainings}
          date={date}
          setDate={setDate}
          refetch={refetch}
        />
        : role.includes(UserRole.MANAGER)
          ? <h1>Manager Group View</h1>
          : role.includes(UserRole.ADMIN)
            ? <h1>Admin Group View</h1>
            : null
    }
  </>
}