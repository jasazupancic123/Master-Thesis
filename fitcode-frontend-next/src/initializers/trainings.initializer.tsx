'use client';

import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import Alert from '../components/alert/alert';
import type { ChildrenProps } from '@/common/type/props.type';
import { Controller } from '@/controller/controller';
import { TrainingService } from '@/controller/training/training.service';
import type { Training } from '@/controller/training/type/training.type';
import { useAuthenticatedAuth } from '@/store/auth-provider';
import { useMain } from '@/store/main-provider';
import type { TrainingProviderProps } from '@/store/training-provider';
import { TrainingProvider } from '@/store/training-provider';

export default function TrainingsInitializer(props: ChildrenProps) {
  const { token } = useAuthenticatedAuth();
  const controller = Controller.getInstance(token);
  const { children } = props;

  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<TrainingProviderProps | null>(null);
  const { exercises, components, methods } = useMain();

  useEffect(() => {
    async function init() {
      setLoading(true);

      let trainings: Training[] = [];
      try {
        const allTrainings = await controller.training.findAll();
        trainings = await Promise.all(
          (allTrainings as Training[]).map(async (t) => {
            TrainingService.mapData(t, { components, exercises, methods });

            t.institution = t.institutionId
              ? await controller.institution.findById(t.institutionId)
              : undefined;

            t.group = t.groupId
              ? await controller.group.findById(t.groupId)
              : undefined;

            t.cycle = t.group?.cycles[0] || undefined;
            return t;
          })
        );
      } catch (error) {
        console.error('Error fetching trainings:', error);
      } finally {
        setLoading(false);
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
        });

      // sort by descending date
      const completedTrainings = trainings
        .filter((t) => {
          if (dayjs(t.from).isBefore(compareDate)) {
            return t;
          }
        })
        .sort((a, b) => {
          return dayjs(b.from).diff(dayjs(a.from));
        });

      const context: TrainingProviderProps = {
        plannedTrainings,
        completedTrainings,
      };

      setState(context);
    }

    init();
  }, []);

  if (!state) return <Alert type="loading" />;
  return <TrainingProvider {...state}>{children}</TrainingProvider>;
}
