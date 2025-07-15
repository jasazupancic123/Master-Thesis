'use client';

import { useEffect, useState } from 'react';
import { ApiUtil } from '@/common/service/util/api.util';
import { UserController } from '@/controller/user/user.controller';
import Loading from '../components/loading/loading';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { ExerciseController } from '@/controller/exercise/exercise.controller';
import { ComponentController } from '@/controller/component/component.controller';
import { TrainingController } from '@/controller/training/training.controller';
import { MethodController } from '@/controller/method/method.controller';
import { notFound } from 'next/navigation';
import { TrainingService } from '@/controller/training/training.service';
import { ChildrenProps } from '@/common/type/props.type';
import { Training } from '@/controller/training/type/training.type';
import {
  TrainingProvider,
  TrainingProviderProps,
} from '@/store/training-provider';

export default function TrainingsInitializer({ children }: ChildrenProps) {
  const [state, setState] = useState<TrainingProviderProps | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const profile = await UserController.findMe();

        const role = profile.customClaims.role[0];
        const [trainings, exercises, components, methods] = await Promise.all([
          TrainingController.findAll(),
          ExerciseController.findAllGlobal(),
          ComponentController.findAll(),
          MethodController.findAll(),
        ]);

        if ([UserRole.ADMIN, UserRole.MANAGER].includes(role))
          return notFound();

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
          profile,
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
