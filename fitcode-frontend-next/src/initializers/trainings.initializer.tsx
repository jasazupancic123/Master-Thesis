'use client';

import { useEffect, useState } from 'react';
import Alert from '../components/alert/alert';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import { ChildrenProps } from '@/common/type/props.type';
import { Training } from '@/controller/training/type/training.type';
import {
  TrainingProvider,
  TrainingProviderProps,
} from '@/store/training-provider';
import { useMain } from '@/store/main-provider';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { GroupController } from '@/controller/group/group.controller';
import { InstitutionController } from '@/controller/institution/institution.controller';
import dayjs from 'dayjs';
import { Pagination } from '@/common/type/paginate.type';

export default function TrainingsInitializer({ children }: ChildrenProps) {
  const [state, setState] = useState<TrainingProviderProps | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  const { profile, exercises, components, methods } = useMain();

  const PAGE_SIZE = 20;

  const [plannedTrainingsPagination, setPlannedTrainingsPagination] =
    useState<Pagination>({
      page: 1,
      pageSize: PAGE_SIZE,
      pages: 1,
      total: 0,
    });

  const [completedTrainingsPagination, setCompletedTrainingsPagination] =
    useState<Pagination>({
      page: 1,
      pageSize: PAGE_SIZE,
      pages: 1,
      total: 0,
    });

  useEffect(() => {
    async function init() {
      try {
        const roles = profile.customClaims.role;

        if (!roles.includes(UserRole.ATHLETE)) return setUnauthorized(true);

        const [trainings] = await Promise.all([TrainingController.findAll()]);
        // kak fetchat institucije in grupe
        // naj fetcham vse treninge al naj mamo paginacijo?

        const compareDate =
          dayjs().hour() < 12
            ? dayjs().startOf('day')
            : dayjs().set('hour', 12);

        // sort by ascending date
        const plannedTrainings = trainings
          .filter((t) => {
            if (
              dayjs(t.from).isAfter(compareDate) ||
              dayjs(t.from).isSame(compareDate)
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

        const mappedTrainings: Training[] = await Promise.all(
          (trainings as Training[]).map(async (t) => {
            t = TrainingService.mapComponentsExercisesMethods(
              t,
              components,
              exercises,
              methods
            );
            t.institution = t.institutionId
              ? await InstitutionController.findById(t.institutionId)
              : undefined;
            t.group = t.groupId
              ? await GroupController.findById(t.groupId)
              : undefined;
            t.cycle = t.group?.cycles[0] || undefined;
            return t;
          })
        );

        console.log('mappedTrainings', mappedTrainings);

        const context: TrainingProviderProps = {
          trainings: mappedTrainings,
        };

        setState(context);
      } catch (e) {
        setUnauthorized(true);
      }
    }

    init();
  }, []);

  if (!state) return <Alert type="loading" />;
  if (unauthorized) return <Alert type="unauthorized" />;

  return <TrainingProvider {...state}>{children}</TrainingProvider>;
}
