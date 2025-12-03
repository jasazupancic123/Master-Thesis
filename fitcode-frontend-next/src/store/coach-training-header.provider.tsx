'use client';

import { createContext, useContext, useState } from 'react';

import { TrackingMethod } from '@/core/training/enum/tracking-method.enum';
import type { SetState } from '@/lib/common/type/state.type';

interface ICoachTrainingHeaderContext {
  view: TrackingMethod;
  setView: SetState<TrackingMethod>;
}

const CoachTrainingHeaderContext = createContext<
  ICoachTrainingHeaderContext | undefined
>(undefined);

export const CoachTrainingHeaderProvider = (props: React.PropsWithChildren) => {
  const [view, setView] = useState<TrackingMethod>(TrackingMethod.MANUAL);

  return (
    <CoachTrainingHeaderContext.Provider value={{ view, setView }}>
      {props.children}
    </CoachTrainingHeaderContext.Provider>
  );
};

export const useCoachTrainingHeader = () =>
  useContext(CoachTrainingHeaderContext)!;
