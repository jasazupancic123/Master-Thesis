import dayjs from 'dayjs';
import { useMemo } from 'react';

import type { Cycle } from '@/core/institution/type/cycle.type';
import type { Group } from '@/core/institution/type/group.type';

export default function useDashboardCycles(groups: Group[]) {
  const cycles = useMemo(() => {
    const now = dayjs();

    return groups
      .map((group) => {
        const cycle = group.cycles.find(
          (c) => dayjs(c.from).isBefore(now) && dayjs(c.to).isAfter(now)
        );
        return cycle ? ({ ...cycle, groupId: group.id } as const) : null;
      })
      .filter(Boolean) as (Cycle & { groupId: string })[];
  }, [groups]);

  const cyclesWithProgress = useMemo(() => {
    console.log('cycles', cycles);
    return cycles.map((cycle) => {
      const total = dayjs(cycle.to).diff(dayjs(cycle.from), 'day');
      const elapsed = dayjs().diff(dayjs(cycle.from), 'day');
      const progress =
        total <= 0 ? 0 : Math.min(100, Math.max(0, (elapsed / total) * 100));
      return { ...cycle, progress };
    });
  }, [cycles]);

  return { cyclesWithProgress };
}
