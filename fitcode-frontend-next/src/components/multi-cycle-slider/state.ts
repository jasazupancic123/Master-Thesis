import { IdEntity } from '@/common/type/entity.type';
import {
  handleApiRequest,
  SetState,
  SetStateNullable,
} from '@/common/type/state.type';
import { GroupController } from '@/controller/group/group.controller';
import { Cycle } from '@/controller/group/type/cycle.type';
import { Group } from '@/controller/group/type/group.type';
import dayjs from 'dayjs';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { RefObject } from 'react';
import toast from 'react-hot-toast';
import { v4 } from 'uuid';

type AddCycleInput = Pick<Cycle, 'name' | 'from' | 'to' | 'description'>;

export async function handleAddCycle(
  input: AddCycleInput,
  state: { setGroup: SetState<Group> }
) {
  const { setGroup } = state;
  const { name, description, from, to } = input;

  if (!name || !from || !to) {
    toast.error('Please fill in all required fields.');
    return;
  }

  if (from > to) {
    toast.error('Start date must be before end date.');
    return;
  }

  setGroup((prev) => ({
    ...prev,
    cycles: [
      ...prev.cycles,
      {
        id: v4(),
        name,
        from,
        to,
        description,
        leafComponentsIds: [],
        rootComponentsIds: [],
        weeks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  }));
}

export function changeYear(
  direction: 'prev' | 'next',
  setSelectedYear: SetState<number>
) {
  setSelectedYear((prev) => (direction === 'prev' ? prev - 1 : prev + 1));
}

export function handleDragChange(
  sliderRef: RefObject<HTMLDivElement | null>,
  input: {
    newValues: number[];
    draggingIndex: number | null;
    mouseX: number | null;
  },
  state: {
    setValuesReal: SetState<number[]>;
    setGroup: SetState<Group>;
  }
) {
  const { newValues, draggingIndex, mouseX } = input;
  const { setValuesReal } = state;

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
  input: {
    index: number;
    value: number;
    selectedYear: number;
  },
  state: {
    setDraggedDay: SetState<number | null>;
    setValuesReal: SetState<number[]>;
    sortedCycles: Cycle[];
  }
) {
  const { index, value, selectedYear } = input;
  const { setDraggedDay, setValuesReal, sortedCycles } = state;

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
  input: {
    groupId: string;
    sortedCycles: Cycle[];
  },
  state: {
    router: AppRouterInstance;
    cycle?: Cycle;
    setCycle: SetStateNullable<Cycle>;
    group: Group;
    setGroup: SetState<Group>;
    detectedChange: boolean;
    setDetectedChange: SetState<boolean>;
    setSortedCycles: SetState<Cycle[]>;
    valuesReal: number[];
    selectedYear: number;
  }
) {
  /* const { groupId, sortedCycles } = input;
  const {
    router,
    cycle,
    setCycle,
    group,
    setGroup,
    detectedChange,
    setDetectedChange,
    setSortedCycles,
    valuesReal,
    selectedYear,
  } = state;

  if (!detectedChange) return;

  // look for date changes in between original cycles and sortedCycles
  const updatedCycles = sortedCycles
    .map((c, i) => {
      const startValue = valuesReal[i * 2];
      const endValue = valuesReal[i * 2 + 1];

      const cycleStartDays = dayjs(c.from).dayOfYear();
      const cycleEndDays = dayjs(c.to).dayOfYear();

      let foundUpdate = false;
      const cycle: AddCycleInput & IdEntity = {
        id: c.id,
        name: c.name,
        description: c.description,
        from: new Date(),
        to: new Date(),
      };

      if (
        dayjs(c.from).year() === selectedYear &&
        cycleStartDays !== startValue
      ) {
        foundUpdate = true;
        cycle.from = dayjs().dayOfYear(startValue).year(selectedYear).toDate();
      } else cycle.from = c.from;

      if (dayjs(c.to).year() === selectedYear && cycleEndDays !== endValue) {
        foundUpdate = true;
        cycle.to = dayjs().dayOfYear(endValue).year(selectedYear).toDate();
      } else cycle.to = c.to;

      if (!foundUpdate) return null;
      return cycle;
    })
    .filter(Boolean);

  if (updatedCycles.length === 0) return toast.error('No changes detected.');

  handleApiRequest(
    router,
    () =>
      Promise.all(
        updatedCycles.map((cycle) =>
          GroupController.updateCycle(token, groupId, cycle!.id, {
            name: cycle!.name,
            description: cycle!.description,
            from: cycle!.from,
            to: cycle!.to,
          })
        )
      ),
    (cycles) => {
      const newCycles = group.cycles.map((item) => {
        const updatedCycle = cycles.find((cycle) => cycle?.id === item.id);
        return updatedCycle ? updatedCycle : item;
      });

      setGroup((prev) => ({ ...prev, cycles: newCycles }));
      setDetectedChange(false);
      setSortedCycles(newCycles);
      setCycle(cycles.find((c) => cycle?.id === c.id)!);

      toast.success('Cycles updated successfully!');
    },
    (e) => {
      if (e.message?.toLowerCase().includes('overlap'))
        return toast.error('Cycle dates overlap with an existing cycle.');
    },
    'Failed to update cycles.'
  ); */
}
