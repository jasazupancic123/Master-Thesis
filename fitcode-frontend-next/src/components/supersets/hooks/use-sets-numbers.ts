import { useEffect, useState } from 'react';

import { VolWorkSetType } from '@/controller/component/enum/param.enum';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';
import { useSupersets } from '@/store/supersets.provider';

export type SetsNumbers = { exerciseId: string; setsNumber: number }[];

export default function useSupersetsSetsNumbers() {
  const { component, selectedSubgroup } = useTrainerDayViewContext();

  const [setsNumbers, setSetsNumbers] = useState<SetsNumbers>([]);

  // update setsNumbers on method change
  useEffect(() => {
    if (!component || !component.method) return;

    const setsRange = component.method?.attributes
      ?.map((a) => a.options?.find((o) => o.field === VolWorkSetType.Set))
      .find(Boolean);

    if (!setsRange) return;

    const { min, max } = setsRange;

    if (min === undefined && max === undefined) return;

    setSetsNumbers((prev) => {
      const newSetsNumbers = prev.map((item) => {
        return {
          ...item,
          setsNumber: Math.max(
            min || 0,
            Math.min(max || 1000, item.setsNumber)
          ),
        };
      });
      return newSetsNumbers;
    });
  }, [component?.method]);

  useEffect(() => {
    const newSetsNumbers = [] as { exerciseId: string; setsNumber: number }[];

    if (selectedSubgroup) {
      selectedSubgroup.supersets.forEach((superset) => {
        superset.exercises.forEach((exercise) => {
          const setsNumber = exercise.sets.length;
          newSetsNumbers.push({
            exerciseId: exercise.id,
            setsNumber: setsNumber,
          });
        });
      });
    } else {
      component?.supersets?.forEach((superset) => {
        superset.exercises?.forEach((exercise) => {
          const setsNumber = exercise.sets.length;
          newSetsNumbers.push({
            exerciseId: exercise.id,
            setsNumber: setsNumber,
          });
        });
      });
    }

    // update sets numbers if method and ranges do not exist
    setSetsNumbers(newSetsNumbers);
  }, [component, selectedSubgroup]);

  return {
    setsNumbers,
    setSetsNumbers,
  };
}
