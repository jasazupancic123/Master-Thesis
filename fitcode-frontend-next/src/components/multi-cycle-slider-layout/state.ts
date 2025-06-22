import { SetState, SetStateNullable } from '@/common/type/state.type';
import { PeriodizationType } from '@/controller/group/enum/periodization-type.enum';
import { Cycle, Week } from '@/controller/group/type/cycle.type';
import { Group } from '@/controller/group/type/group.type';
import { Periodization } from '@/controller/group/type/periodization.type';
import dayjs from 'dayjs';
import { RefObject } from 'react';
import toast from 'react-hot-toast';
import { v4 } from 'uuid';
// import isoWeek from 'dayjs/plugin/isoWeek';

// dayjs.extend(isoWeek);

type AddCycleInput = Pick<Cycle, 'name' | 'from' | 'to' | 'description'>;

export async function handleAddCycle(
  input: AddCycleInput,
  state: {
    selectedGroup: Group;
    setSelectedGroup: SetState<Group>;
    setCycles: SetState<Cycle[]>;
    setDetectedChanges: SetState<boolean>;
  }
) {
  const { selectedGroup, setSelectedGroup, setCycles, setDetectedChanges } =
    state;
  const { name, description, from, to } = input;

  if (!name || !from || !to) {
    toast.error('Please fill in all required fields.');
    return;
  }

  if (from > to) {
    toast.error('Start date must be before end date.');
    return;
  }

  const newCycles = [
    ...state.selectedGroup.cycles,
    {
      id: v4(),
      name,
      from,
      to,
      description,
      leafComponentsIds: [],
      rootComponentsIds: [],
      weeks: [],
      periodization: {
        type: PeriodizationType.NONE,
        basePeriodizationTrainingIds: [],
      } as Periodization,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Cycle,
  ];
  setDetectedChanges(true);
  setCycles(newCycles);
  const newGroup = { ...selectedGroup, cycles: newCycles };
  setSelectedGroup(newGroup);
}

export function changeYear(
  direction: 'prev' | 'next',
  setSelectedYear: SetState<number>
) {
  setSelectedYear((prev) => (direction === 'prev' ? prev - 1 : prev + 1));
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
  },
  setDetectedChanges: SetState<boolean>
) {
  setDetectedChanges(true);
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

export function handleChange(
  input: {
    newValues: number[];
    draggingIndex: number | null;
    mouseX: number | null;
  },
  state: {
    sliderRef: RefObject<HTMLDivElement | null>;
    setValuesReal: SetState<number[]>;
    setDetectedChanges: SetState<boolean>;
  }
) {
  const { newValues, draggingIndex, mouseX } = input;

  const { sliderRef, setValuesReal, setDetectedChanges } = state;

  if (draggingIndex !== null) {
    if (newValues[draggingIndex + 1] === 1 && sliderRef.current) {
      //Get the slider position & size
      const sliderBounds = sliderRef.current.getBoundingClientRect();
      if (!mouseX) return;
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

  setDetectedChanges(true);
  setValuesReal([...newValues]);
}

export function handleDragEnd(
  input: {
    draggingIndex: number | null;
    selectedYear: number;
    sortedCycles: Cycle[];
    valuesReal: number[];
  },
  state: {
    selectedGroup: Group | null;
    setSelectedGroup: SetState<Group>;
    setDraggingIndex: SetState<number | null>;
    setDraggedDay: SetState<number | null>;
  }
) {
  const { draggingIndex, selectedYear, sortedCycles, valuesReal } = input;
  const { selectedGroup, setSelectedGroup, setDraggingIndex, setDraggedDay } =
    state;
  if (!selectedGroup) return;

  if (draggingIndex === undefined || draggingIndex === null) return;
  const cycleIndex = Math.floor(draggingIndex / 2);
  if (!sortedCycles[cycleIndex]) return;

  const cycle = { ...[...sortedCycles][cycleIndex] };
  const isStartDot = draggingIndex % 2 === 0; // Even index = start, Odd index = end

  // Ensure correct year boundaries
  if (isStartDot && dayjs(cycle.from).year() < selectedYear) return; // Prevent the start dot from moving back into previous years
  if (!isStartDot && dayjs(cycle.to).year() > selectedYear) return; // Prevent the end dot from moving back into previous years

  let from = cycle.from;
  let to = cycle.to;

  if (isStartDot) {
    from = dayjs()
      .year(selectedYear) // Set the desired year first
      .dayOfYear(valuesReal[cycleIndex * 2])
      .startOf('week') // Moves to the start of the week (usually Sunday)
      .toDate();
  } else {
    to = dayjs()
      .year(selectedYear) // Set the desired year first
      .dayOfYear(valuesReal[cycleIndex * 2 + 1])
      .startOf('week') // Moves to the start of the week (usually Sunday)
      .toDate();
  }

  const weeks: Week[][] = Array.from(
    { length: dayjs(to).diff(from, 'week') + 2 },
    (_, i) => {
      const startOfWeek = dayjs(from).add(i, 'w').startOf('w');
      return Array.from({ length: 7 }, (_, j) => ({
        date: startOfWeek.toDate(),
      }));
    }
  );

  const newCycle = {
    ...cycle,
    from: from,
    to: to,
    weeks: weeks,
  };

  const newCycles = [
    ...selectedGroup.cycles.map(({ ...c }) =>
      c.id === cycle.id ? newCycle : c
    ),
  ];

  const newGroup = { ...selectedGroup, cycles: newCycles };
  setSelectedGroup(newGroup);

  setDraggingIndex(null);
  setDraggedDay(null);
}
