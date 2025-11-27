'use client';

import { startOfDay } from 'date-fns';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { useMain } from './main.provider';
import { Controller } from '@/core/controller';
import { UserRole } from '@/core/profile/enum/user-role.enum';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingReport } from '@/core/training/type/training-report.type';
import {
  LINK_TRAININGS,
  LINKS_SIDEBAR_GROUP_VIEW,
} from '@/lib/common/const/nav.const';
import type { Fetch } from '@/lib/common/type/fetch.type';
import type { ILink } from '@/lib/common/type/link.type';
import type { SetState } from '@/lib/common/type/state.type';

interface IAthleteContext {
  trainings: Fetch<Training[]>;
  reports: Fetch<TrainingReport[]>;
  selectedDate: Dayjs;
  setSelectedDate: SetState<Dayjs>;
  hasJustLoggedIn: boolean;
  setHasJustLoggedIn: SetState<boolean>;
  filter: ILink;
  setFilter: SetState<ILink>;
}

const AthleteContext = createContext<IAthleteContext | null>(null);

export const useAthlete = () => useContext(AthleteContext)!;

export function AthleteProvider(props: React.PropsWithChildren) {
  const { children } = props;
  const { institution } = useMain();
  const [selectedDate, setSelectedDate] = useState(dayjs(new Date()));
  const [hasJustLoggedIn, setHasJustLoggedIn] = useState(true);

  const [trainings, setTrainings] = useState<Fetch<Training[]>>({
    data: [],
    loading: false,
    error: null,
  });

  const [reports, setReports] = useState<Fetch<TrainingReport[]>>({
    data: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      setTrainings((prev) => ({ ...prev, loading: true }));
      setReports((prev) => ({ ...prev, loading: true }));

      const controller = Controller.getInstance();
      const [reports, trainings] = await Promise.allSettled([
        controller.training.findReports(institution.id),
        controller.training.findAll({
          institutionId: institution.id,
          from: startOfDay(new Date()),
          populate: true,
          limit: 100,
        }),
      ]);

      setTrainings({
        data: trainings.status === 'fulfilled' ? trainings.value : [],
        loading: false,
        error:
          trainings.status === 'rejected' ? trainings.reason.message : null,
      });

      setReports({
        data: reports.status === 'fulfilled' ? reports.value : [],
        loading: false,
        error: reports.status === 'rejected' ? reports.reason.message : null,
      });
    };

    fetchData().then();
  }, []);

  let currentFilter = LINK_TRAININGS;
  const url = new URL(window.location.href);
  const lastItemInUrl = url.pathname.split('/').pop();
  Object.values(LINKS_SIDEBAR_GROUP_VIEW[UserRole.ATHLETE]).map((link) => {
    if (lastItemInUrl && link?.href.endsWith(lastItemInUrl)) {
      currentFilter = link;
    }
  });

  const [filter, setFilter] = useState<ILink>(currentFilter);
  const value: IAthleteContext = {
    selectedDate,
    setSelectedDate,
    hasJustLoggedIn,
    setHasJustLoggedIn,
    filter,
    setFilter,
    trainings,
    reports,
  };

  return (
    <AthleteContext.Provider value={value}>{children}</AthleteContext.Provider>
  );
}
