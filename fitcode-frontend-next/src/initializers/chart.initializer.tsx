'use client';

import { useEffect, useState } from 'react';
import { ApiUtil } from '@/common/service/util/api.util';
import { UserController } from '@/controller/user/user.controller';
import Loading from '../components/loading/loading';
import { ExerciseController } from '@/controller/exercise/exercise.controller';
import { ComponentController } from '@/controller/component/component.controller';
import { ChartContextProps, ChartProvider } from '@/store/chart-provider';
import { ChildrenProps } from '@/common/type/props.type';

export default function ChartInitializer({ children }: ChildrenProps) {
  const [state, setState] = useState<ChartContextProps | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const profile = await UserController.findMe();

        const [exercises, components] = await Promise.all([
          ExerciseController.findAllGlobal(),
          ComponentController.findAll(),
        ]);

        setState({
          profile,
          exercises,
          components,
        });
      } catch (e) {
        setUnauthorized(true);
      }
    }

    init();
  }, []);

  if (!state) return <Loading text="Loading..." />;
  if (unauthorized) return <Loading text="Unauthorized" />;

  return <ChartProvider {...state}>{children}</ChartProvider>;
}
