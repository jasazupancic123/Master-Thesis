import { handleApiRequest, SetState } from '@/common/type/state.type';
import { GroupController } from '@/controller/group/group.controller';
import { Cycle } from '@/controller/group/type/cycle.type';
import { Group } from '@/controller/group/type/group.type';
import dayjs from 'dayjs';
import { RefObject } from 'react';
import toast from 'react-hot-toast';

export function changeYear(
  direction: 'prev' | 'next',
  setSelectedYear: SetState<number>
) {
  setSelectedYear((prev) => (direction === 'prev' ? prev - 1 : prev + 1));
}

export function handleDragChange(
  newValues: number[],
  draggingIndex: number | null,
  sliderRef: RefObject<HTMLDivElement | null>,
  mouseX: number | null,
  setValuesReal: SetState<number[]>
) {
  if (draggingIndex !== null) {
    if (newValues[draggingIndex + 1] === 1 && sliderRef?.current) {
      const sliderBounds = sliderRef.current?.getBoundingClientRect();
      if (!mouseX || !sliderBounds) return;

      const relativeX = mouseX - sliderBounds.left; // X position inside the slider
      const sliderWidth = sliderBounds.width;

      let adjustedValue = Math.round((relativeX / sliderWidth) * 365);
      adjustedValue = Math.max(2, Math.min(365, adjustedValue));

      setValuesReal((prev) => {
        const updatedValues = [...prev];
        updatedValues[draggingIndex] = adjustedValue;
        return updatedValues;
      });

      return;
    }
  }

  setValuesReal([...newValues]);
}

export function handleDrag(
  index: number,
  value: number,
  selectedYear: number,
  setDraggedDay: SetState<number | null>,
  setValuesReal: SetState<number[]>,
  sortedCycles: Cycle[]
) {
  setDraggedDay(value);
  setValuesReal((prev) => {
    const updated = [...prev];

    const cycleIndex = Math.floor(index / 2);
    if (!sortedCycles[cycleIndex]) return prev; // Ensure cycle exists

    const cycle = sortedCycles[cycleIndex];
    const isStartDot = index % 2 === 0; // Even index = start, Odd index = end

    // Ensure correct year boundaries
    if (isStartDot && dayjs(cycle.from).year() < selectedYear) {
      return prev; // Prevent the start dot from moving back into previous years
    }
    if (!isStartDot && dayjs(cycle.to).year() > selectedYear) {
      return prev; // Prevent the end dot from moving back into previous years
    }

    updated[index] = value;
    return updated;
  });
}

export async function handleUpdateCycleDates(
  token: string,
  groupId: string,
  selectedGroup: Group,
  setSelectedGroup: SetState<Group>,
  detectedChange: boolean,
  setDetectedChange: SetState<boolean>,
  sortedCycles: Cycle[],
  setSortedCycles: SetState<Cycle[]>,
  valuesReal: number[],
  selectedYear: number
) {
  if (!detectedChange) return;

  // look for date changes in between original cycles and sortedCycles
  const updatedCycles = sortedCycles
    .map((cycle, index) => {
      const startValue = valuesReal[index * 2];
      const endValue = valuesReal[index * 2 + 1];

      const cycleStartDays = dayjs(cycle.from).dayOfYear();
      const cycleEndDays = dayjs(cycle.to).dayOfYear();

      let foundUpdate = false;
      const cycle_: any = {
        id: cycle.id,
        name: cycle.name,
        description: cycle.description,
      };

      if (
        dayjs(cycle.from).year() === selectedYear &&
        cycleStartDays !== startValue
      ) {
        foundUpdate = true;

        cycle_.from = dayjs().dayOfYear(startValue).year(selectedYear).toDate();
      } else cycle_.from = cycle.from;

      if (
        dayjs(cycle.to).year() === selectedYear &&
        cycleEndDays !== endValue
      ) {
        foundUpdate = true;
        cycle_.to = dayjs().dayOfYear(endValue).year(selectedYear).toDate();
      } else cycle_.to = cycle.to;

      if (!foundUpdate) return null;
      return cycle_;
    })
    .filter(Boolean);

  if (updatedCycles.length === 0) {
    toast.error('No changes detected.');
    return;
  }

  handleApiRequest(
    () =>
      Promise.all(
        updatedCycles.map((cycle) =>
          GroupController.updateCycle(token, groupId, cycle.id, {
            name: cycle.name,
            description: cycle.description,
            from: cycle.from,
            to: cycle.to,
          })
        )
      ),
    (_cycles) => {
      const newCycles = selectedGroup.cycles.map((item) => {
        const updatedCycle = updatedCycles.find(
          (cycle) => cycle?.id === item.id
        );

        return updatedCycle ? updatedCycle : item;
      });

      setSelectedGroup((prev) => ({ ...prev, cycles: newCycles }));
      setDetectedChange(false);
      setSortedCycles(newCycles);

      toast.success('Cycles updated successfully!');
    },
    (e) => {
      if (e.message?.toLowerCase().includes('overlap')) {
        toast.error('Cycle dates overlap with an existing cycle.');
        return;
      }

      toast.error('Failed to update cycles.');
    }
  );
}
