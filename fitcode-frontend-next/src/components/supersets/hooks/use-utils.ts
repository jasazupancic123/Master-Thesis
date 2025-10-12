import { MainSet } from '@/controller/training/enum/main-set.enum';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';
import {
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useMemo, useState } from 'react';

export type UseSupersetsUtilsReturnType = ReturnType<typeof useSupersetsUtils>;

export default function useSupersetsUtils() {
  const { component, selectedSubgroup, supersets } = useTrainerDayViewContext();

  const [openVideoPlayerModal, setOpenVideoPlayerModal] = useState(false);

  const isCircuit =
    (selectedSubgroup || component)?.mainSet === MainSet.CIRCUIT;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 0, tolerance: 5 },
    })
  );

  const disabledSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 999999 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 999999, tolerance: 999999 },
    })
  );

  const getContainerIdForSupersetIndex = (i: number) => `${component!.id}-${i}`;

  const itemsByContainer = useMemo(() => {
    if (!component) return {} as Record<string, string[]>;

    const map: Record<string, string[]> = {};
    supersets?.forEach((s, i) => {
      map[getContainerIdForSupersetIndex(i)] = s.exercises.map((e) => e.id);
    });

    return map;
  }, [supersets, component]);

  return {
    isCircuit,
    openVideoPlayerModal,
    setOpenVideoPlayerModal,
    sensors,
    disabledSensors,
    itemsByContainer,
  };
}
