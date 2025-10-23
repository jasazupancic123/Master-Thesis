import { createContext, useContext, useState } from 'react';

import { TrackingMethod } from '@/core/training/enum/tracking-method.enum';
import type { SetState } from '@/lib/common/type/state.type';

interface IContext {
  selectedTrackingMethod: TrackingMethod;
  setSelectedTrackingMethod: SetState<TrackingMethod>;
}

const AthleteHeaderContext = createContext<IContext | null>(null);

export const AthleteHeaderProvider = (props: React.PropsWithChildren) => {
  const { children } = props;
  const [selectedTrackingMethod, setSelectedTrackingMethod] =
    useState<TrackingMethod>(TrackingMethod.MANUAL);

  return (
    <AthleteHeaderContext.Provider
      value={{ selectedTrackingMethod, setSelectedTrackingMethod }}
    >
      {children}
    </AthleteHeaderContext.Provider>
  );
};

export const useAthleteHeader = () => useContext(AthleteHeaderContext)!;
