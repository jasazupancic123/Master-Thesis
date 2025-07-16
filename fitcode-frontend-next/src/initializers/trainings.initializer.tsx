'use client';

import { useEffect, useState } from 'react';
import Loading from '../components/loading/loading';
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

        const mappedTrainings = (trainings as Training[]).map((t) => {
          t = TrainingService.mapComponentsExercisesMethods(
            t,
            components,
            exercises,
            methods
          );
          return t;
        });

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

  if (!state) return <Loading text="Loading..." />;
  if (unauthorized) return <Loading text="Unauthorized" />;

  return <TrainingProvider {...state}>{children}</TrainingProvider>;
}
