'use client';

import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import type { ChildrenProps } from '@/common/type/props.type';
import { Controller } from '@/controller/controller';
import { TrainingService } from '@/controller/training/training.service';
import type { Training } from '@/controller/training/type/training.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useMain } from '@/store/main.provider';
import type { TrainingProviderProps } from '@/store/training.provider';
import { TrainingProvider } from '@/store/training.provider';

export default function TrainingsInitializer(props: ChildrenProps) {
  const { token } = useAuthenticatedAuth();
  const controller = Controller.getInstance(token);
  const { children } = props;

  const { exercises, components, methods, groups } = useMain();
  const [state, setState] = useState<TrainingProviderProps>({
    plannedTrainings: [],
    completedTrainings: [],
  });

  useEffect(() => {
    async function init() {
      let trainings: Training[] = [];
      try {
        trainings = await controller.training.findAll({ populate: true });
        trainings = trainings.map((t) => {
          TrainingService.mapData(t, { components, exercises, methods });
          return t;
        });
      } catch (error) {
        console.error('Error fetching trainings:', error);
      }

      // sort by ascending date
      const compareDate = dayjs().startOf('day');
      const plannedTrainings = trainings
        .filter((t) => {
          if (
            dayjs(t.from).isAfter(compareDate) ||
            dayjs(t.from).isSame(compareDate, 'day')
          ) {
            return t;
          }
        })
        .sort((a, b) => {
          return dayjs(a.from).diff(dayjs(b.from));
        })
        .map((t) => ({
          ...t,
          group: groups.find((g) => g.id === t.groupId),
        }));

      // sort by descending date
      const completedTrainings = trainings
        .filter((t) => {
          if (dayjs(t.from).isBefore(compareDate)) {
            return t;
          }
        })
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
