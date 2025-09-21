'use client';

import { endOfDay, startOfDay, subDays } from 'date-fns';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import type { ChildrenProps } from '@/common/type/props.type';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingReport } from '@/controller/training/type/training-report.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useMain } from '@/store/main.provider';
import type { TrainingProviderProps } from '@/store/training.provider';
import { TrainingProvider } from '@/store/training.provider';

export default function TrainingsInitializer(props: ChildrenProps) {
  const { token } = useAuthenticatedAuth();
  const controller = TrainingController.getInstance(token);
  const { children } = props;

  const { exercises, components, methods, groups, institutions } = useMain();
  const [state, setState] = useState<TrainingProviderProps>({
    plannedTrainings: [],
    completedTrainings: [],
  });

  useEffect(() => {
    async function init() {
      let trainings: Training[] = []; // future
      let reports: TrainingReport[] = []; // past

      try {
        [trainings, reports] = await Promise.all([
          controller.findAll({
            from: startOfDay(new Date()),
            populate: true,
            limit: 10,
          }),
          controller.findReports({
            to: endOfDay(new Date()),
            from: subDays(new Date(), 30),
          }),
        ]);

        trainings = trainings.map((t) => {
          TrainingService.mapData(t, { components, exercises, methods });
          return t;
        });

        reports = reports.map((t) =>
          TrainingService.mapReport(t, { institutions, groups, components })
        );
      } catch (error) {
        console.error('Error fetching trainings:', error);
      }

      // sort by ascending date
      const plannedTrainings = trainings
        .sort((a, b) => {
          return dayjs(a.from).diff(dayjs(b.from));
        })
        .map((t) => ({
          ...t,
          group: groups.find((g) => g.id === t.groupId),
        }));

      // sort by descending date
      const completedTrainings = reports
        .sort((a, b) => {
          return dayjs(b.from).diff(dayjs(a.from));
        })
        .map((t) => ({
          ...t,
          group: groups.find((g) => g.id === t.groupId),
        }));

      const context: TrainingProviderProps = {
        plannedTrainings,
        completedTrainings,
      };

      setState(context);
    }

    init().then();
  }, []);

  return <TrainingProvider {...state}>{children}</TrainingProvider>;
}
