'use client';

import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import React, { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { useAuthenticatedAuth } from './auth.provider';
import { useMain } from './main.provider';
import { Controller } from '@/core/controller';
import { TrainingController } from '@/core/training/training.controller';
import { TrainingService } from '@/core/training/training.service';
import type { TrainingReport } from '@/core/training/type/training-report.type';
import { UserRole } from '@/core/user/enum/user-role.enum';
import {
  LINK_ATHLETE_HOME,
  LINKS_SIDEBAR_GROUP_VIEW,
} from '@/lib/common/const/nav.const';
import type { Fetch } from '@/lib/common/type/fetch.type';
import type { ILink } from '@/lib/common/type/link.type';
import type { SetState } from '@/lib/common/type/state.type';

interface IAthleteContext {
  reports: Fetch<TrainingReport[]>;
  selectedDate: Dayjs;
  setSelectedDate: SetState<Dayjs>;
  hasJustLoggedIn: boolean;
  setHasJustLoggedIn: SetState<boolean>;
  filter: ILink;
  setFilter: SetState<ILink>;
  recalculateReports: () => Promise<void>;
}

const AthleteContext = createContext<IAthleteContext | null>(null);

export const useAthlete = () => useContext(AthleteContext)!;

export function AthleteProvider(props: React.PropsWithChildren) {
  const { children } = props;
  const { institution } = useMain();
  const { user } = useAuthenticatedAuth();
  const [selectedDate, setSelectedDate] = useState(dayjs(new Date()));
  const [hasJustLoggedIn, setHasJustLoggedIn] = useState(true);

  const [reports, setReports] = useState<Fetch<TrainingReport[]>>({
    data: [],
    loading: false,
    error: null,
  });

  async function recalculateReports() {
    try {
      await TrainingController.getInstance().recalculateReports(
        institution.id,
        user.uid
      );

      // refetch reports
      setReports((prev) => ({ ...prev, loading: true }));
      const controller = Controller.getInstance();
      const [reports] = await Promise.allSettled([
        controller.training.findReports(institution.id),
      ]);

      // map reports
      const mapped =
        reports.status === 'fulfilled'
          ? reports.value.map((r) =>
              TrainingService.mapReport(r, {
                institutions: [institution],
                groups: institution.groups,
              })
            )
          : [];

      setReports({ data: mapped, loading: false, error: null });
      toast.success('Reports recalculated');
    } catch (e) {
      console.error('Failed to recalculate reports', e);
      toast.error('Failed to recalculate reports');
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setReports((prev) => ({ ...prev, loading: true }));

      const controller = Controller.getInstance();
      const [reports] = await Promise.allSettled([
        controller.training.findReports(institution.id),
      ]);

      // map reports
      const mapped =
        reports.status === 'fulfilled'
          ? reports.value.map((r) =>
              TrainingService.mapReport(r, {
                institutions: [institution],
                groups: institution.groups,
              })
            )
          : [];

      setReports({ data: mapped, loading: false, error: null });
    };

    fetchData().then();
  }, []);

  let currentFilter = LINK_ATHLETE_HOME;
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
    reports,
    recalculateReports,
  };

  return (
    <AthleteContext.Provider value={value}>{children}</AthleteContext.Provider>
  );
}
