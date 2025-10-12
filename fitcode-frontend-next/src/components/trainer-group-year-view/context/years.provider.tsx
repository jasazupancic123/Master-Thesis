import { ChildrenProps } from '@/common/type/props.type';
import { SetState } from '@/common/type/state.type';
import dayjs from 'dayjs';
import { createContext, useContext, useState } from 'react';

export type SliderYearProviderReturnType = ReturnType<
  typeof useMultiCycleSliderYearProvider
>;

interface YearsContextProps {
  selectedYear: number;
  setSelectedYear: SetState<number>;
  yearsForSelect: { label: string; sublabel: string; value: string }[];
  yearStart: number;
  yearEnd: number;
}

const YearsSliderContext = createContext<YearsContextProps | null>(null);

export const useMultiCycleSliderYearProvider = () =>
  useContext(YearsSliderContext)!;

export type YearsSliderProviderReturnType = ReturnType<
  typeof useMultiCycleSliderYearProvider
>;

export function YearsSliderProvider(props: ChildrenProps) {
  const { children } = props;

  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [yearsForSelect] = useState<
    { label: string; sublabel: string; value: string }[]
  >(() => {
    const currentYear = dayjs().year();
    const yearsBefore = Array.from(
      { length: 2 },
      (_, i) => currentYear - 1 - i
    );
    const yearsAfter = Array.from({ length: 3 }, (_, i) => currentYear + i);
    return [...yearsBefore.toReversed(), ...yearsAfter].map((year) => ({
      label: 'Year',
      sublabel: year.toString(),
      value: year.toString(),
    }));
  });

  const [yearStart] = useState(dayjs(`${selectedYear}-01-01`).dayOfYear());
  const [yearEnd] = useState(dayjs(`${selectedYear}-12-31`).dayOfYear());

  const value: YearsContextProps = {
    selectedYear,
    setSelectedYear,
    yearsForSelect,
    yearStart,
    yearEnd,
  };

  return (
    <YearsSliderContext.Provider value={value}>
      {children}
    </YearsSliderContext.Provider>
  );
}
