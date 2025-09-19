import { TrackingMethod } from '@/common/enum/tracking-method.enum';
import { ChildrenProps } from '@/common/type/props.type';
import { SetState } from '@/common/type/state.type';
import { createContext, useContext, useState } from 'react';

interface AthleteHeaderContextProps {
  selectedTrackingMethod: TrackingMethod;
  setSelectedTrackingMethod: SetState<TrackingMethod>;
}

const AthleteHeaderContext = createContext<
  AthleteHeaderContextProps | undefined
>(undefined);

export const AthleteHeaderProvider = (props: ChildrenProps) => {
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
