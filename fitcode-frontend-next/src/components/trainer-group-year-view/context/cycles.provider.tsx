import dayjs from 'dayjs';
import { createContext, useContext, useEffect, useState } from 'react';

import { useMultiCycleSliderYearProvider } from './years.provider';
import type { ChildrenProps } from '@/common/type/props.type';
import type { SetState } from '@/common/type/state.type';
import type { Cycle } from '@/controller/group/type/cycle.type';
import { useGroup } from '@/store/group.provider';

interface SliderCyclesContextProps {
  sortedCycles: Cycle[];
  setSortedCycles: SetState<Cycle[]>;
  activeCycle: Cycle | undefined;
  setActiveCycle: SetState<Cycle | undefined>;
  editCycle: Cycle | null;
  setEditCycle: SetState<Cycle | null>;
}

const SliderCyclesContext = createContext<SliderCyclesContextProps | null>(
  null
);

export const useMultiCycleSliderCyclesProvider = () =>
  useContext(SliderCyclesContext)!;

export type SliderCyclesProviderReturnType = ReturnType<
  typeof useMultiCycleSliderCyclesProvider
>;

export function SliderCycleProvider(props: ChildrenProps) {
  const { children } = props;

  const { group, selectedGroup, setSelectedGroup } = useGroup();

  const { selectedYear } = useMultiCycleSliderYearProvider();

  const [sortedCycles, setSortedCycles] = useState<Cycle[]>([]);
  const [activeCycle, setActiveCycle] = useState<Cycle | undefined>(undefined);
  const [editCycle, setEditCycle] = useState<Cycle | null>(null);

  useEffect(() => {
    const currentCycle = selectedGroup.cycles.find(
      (cycle) =>
        dayjs(cycle.from).isBefore(dayjs()) && dayjs(cycle.to).isAfter(dayjs())
    );

    setActiveCycle(currentCycle);
  }, [selectedGroup]);

  // update sortedCycles where the selectedYearChanges
  useEffect(() => {
    const newFilteredCycles = [...selectedGroup.cycles].filter(
      (cycle) =>
        dayjs(cycle.from).year() === selectedYear ||
        dayjs(cycle.to).year() === selectedYear
    );

    const newSortedCycles = newFilteredCycles.sort(
      (a, b) => dayjs(a.from).dayOfYear() - dayjs(b.from).dayOfYear()
    );

    setSortedCycles(newSortedCycles);
  }, [selectedGroup, selectedYear]);

  useEffect(() => {
    const selectedGroup_ = {
      ...group,
      cycles: [...group.cycles].map((cycle) => {
        return {
          ...cycle,
        };
      }),
    };

    setSelectedGroup(selectedGroup_);
  }, [group]);

  const value: SliderCyclesContextProps = {
    sortedCycles,
    setSortedCycles,
    activeCycle,
    setActiveCycle,
    editCycle,
    setEditCycle,
  };

  return (
    <SliderCyclesContext.Provider value={value}>
      {children}
    </SliderCyclesContext.Provider>
  );
}
