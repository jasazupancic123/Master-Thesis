import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';

import type { Cycle } from '@/core/institution/type/cycle.type';
import type { Group } from '@/core/institution/type/group.type';

export default function useDashboardCycles(groups: Group[]) {
  const [cycles, setCycles] = useState<(Cycle & { groupId: string })[]>([]);

  useEffect(() => {
    const currentCycles: (Cycle & { groupId: string })[] = [];

    groups.forEach((group) => {
      const cycle = group.cycles.find(
        (c) => dayjs(c.from).isBefore(dayjs()) && dayjs(c.to).isAfter(dayjs())
      );

      if (cycle) {
        currentCycles.push({ ...cycle, groupId: group.id });
      }
    });

    setCycles(currentCycles);
  }, [groups]);

  const cyclesWithProgress = useMemo(
    () =>
      cycles.map((cycle) => {
        const total = dayjs(cycle.to).diff(dayjs(cycle.from), 'day');
        const elapsed = dayjs().diff(dayjs(cycle.from), 'day');
        const progress =
          total <= 0 ? 0 : Math.min(100, Math.max(0, (elapsed / total) * 100));

        return { ...cycle, progress };
      }),
    [cycles]
  );

  return {
    cyclesWithProgress,
  };
}
