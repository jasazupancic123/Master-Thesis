'use client';

import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import Alert from '../components/alert/alert';
import type { ChildrenProps } from '@/common/type/props.type';
import { GroupController } from '@/controller/group/group.controller';
import { InstitutionController } from '@/controller/institution/institution.controller';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import type { Training } from '@/controller/training/type/training.type';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { useMain } from '@/store/main-provider';
import type { TrainingProviderProps } from '@/store/training-provider';
import { TrainingProvider } from '@/store/training-provider';

export default function TrainingsInitializer({ children }: ChildrenProps) {
  const [state, setState] = useState<TrainingProviderProps | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  const { profile, exercises, components, methods } = useMain();

  useEffect(() => {
    async function init() {
      try {
        const roles = profile.customClaims.role;

        if (!roles.includes(UserRole.ATHLETE)) return setUnauthorized(true);

        const [trainings] = await Promise.all([TrainingController.findAll()]);
        // kak fetchat institucije in grupe
        // naj fetcham vse treninge al naj mamo paginacijo?
        const mappedTrainings: Training[] = await Promise.all(
          (trainings as Training[]).map(async (t) => {
            TrainingService.mapData(t, { components, exercises, methods });

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

        const compareDate = dayjs().startOf('day');

        // sort by ascending date
        const plannedTrainings = mappedTrainings
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
        const completedTrainings = mappedTrainings
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
