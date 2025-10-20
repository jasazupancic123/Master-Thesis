import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { useMultiCycleSliderCyclesProvider } from '@/components/trainer-group-year-view/context/cycles.provider';
import { useMultiCycleSliderYearProvider } from '@/components/trainer-group-year-view/context/years.provider';

export type UseSliderPropertiesReturnType = ReturnType<
  typeof useMultiCycleSliderProperties
>;

export default function useMultiCycleSliderProperties() {
  const [sliderProperties, setSliderProperties] = useState<
    { width: string; centerPosition: string }[]
  >([]);

  const { sortedCycles } = useMultiCycleSliderCyclesProvider();
  const { selectedYear, yearStart, yearEnd } =
    useMultiCycleSliderYearProvider();

  const [valuesReal, setValuesReal] = useState<number[]>(() =>
    sortedCycles.flatMap((cycle) => {
      let start = dayjs(cycle.from).year(selectedYear).dayOfYear();
      let end = dayjs(cycle.to).year(selectedYear).dayOfYear();

      if (dayjs(cycle.from).year() < selectedYear) start = yearStart;
      if (dayjs(cycle.to).year() > selectedYear) end = yearEnd;

      return start < end ? [start, end] : [end, start];
    })
  );

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  useEffect(() => {
    const newSliderProperties = sortedCycles.map((cycle, index) => {
      const start = valuesReal[index * 2];
      const end = valuesReal[index * 2 + 1];

      const centerPosition = `${
        (((start + end) / 2 - yearStart) / (yearEnd - yearStart)) * 100
      }%`;

      const width = `${((end - start) / (yearEnd - yearStart)) * 100}%`;
      return { width, centerPosition };
    });

    setSliderProperties(newSliderProperties);
  }, [sortedCycles, valuesReal]);

  useEffect(() => {
    if (draggingIndex !== null) return; // prevent overriding dragged values

    setValuesReal((_prev) => {
      // if (prev.length === sortedCycles.length * 2) return prev;

      return sortedCycles.flatMap((cycle) => {
        let start = dayjs(cycle.from).dayOfYear();
        let end = dayjs(cycle.to).dayOfYear();

        if (dayjs(cycle.from).year() < selectedYear) start = yearStart;
        if (dayjs(cycle.to).year() > selectedYear) end = yearEnd;

        return [start, end];
      });
    });
  }, [selectedYear, sortedCycles]);

  return {
    sliderProperties,
    setSliderProperties,
    valuesReal,
    setValuesReal,
    draggingIndex,
    setDraggingIndex,
  };
}
