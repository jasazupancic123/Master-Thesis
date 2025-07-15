'use client';

import { useEffect, useState } from 'react';
import { ApiUtil } from '@/common/service/util/api.util';
import { UserController } from '@/controller/user/user.controller';
import Loading from '../components/loading/loading';
import { ChildrenProps } from '@/common/type/props.type';
import { ExerciseController } from '@/controller/exercise/exercise.controller';
import { AttributeController } from '@/controller/attribute/attribute.controller';
import { ComponentController } from '@/controller/component/component.controller';
import { ExerciseProvider } from '@/store/exercises-provider';
import { ExercisePageProps } from '@/common/type/exercise-page-props.type';

export default function ExerciseInitializer({ children }: ChildrenProps) {
  const [state, setState] = useState<ExercisePageProps | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const profile = await UserController.findMe();
        const [exercises, attributes, components] = await Promise.all([
          ExerciseController.findAllGlobal(),
          AttributeController.findAll(),
          ComponentController.findAll(),
        ]);

        setState({
          profile,
          components,
          exercises,
          attributes,
        });
      } catch (e) {
        setUnauthorized(true);
      }
    }

    init();
  }, []);

  if (!state) return <Loading text="Loading..." />;
  if (unauthorized) return <Loading text="Unauthorized" />;

  return <ExerciseProvider {...state}>{children}</ExerciseProvider>;
}
