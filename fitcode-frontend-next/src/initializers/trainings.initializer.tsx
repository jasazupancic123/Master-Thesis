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
