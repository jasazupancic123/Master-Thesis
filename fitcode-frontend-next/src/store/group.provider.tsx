'use client';

import type { DragEndEvent } from '@dnd-kit/core';
import { addMinutes } from 'date-fns';
import dayjs from 'dayjs';
import { createContext, useContext, useEffect, useState } from 'react';

import { useMain } from './main.provider';
import type {
  GroupContextProps,
  GroupIdPageProps,
} from '@/app/(trainer)/groups/[group_id]/props';
import type { Cycle } from '@/core/institution/type/cycle.type';
import type { Group } from '@/core/institution/type/group.type';
import type { Institution } from '@/core/institution/type/institution.type';
import { TrainingController } from '@/core/training/training.controller';
import { lib } from '@/lib';
import type { GroupDateFilter } from '@/lib/common/type/filter.type';

// eslint-disable-next-line
export interface IGroupCtx extends GroupContextProps {}

const GroupContext = createContext<IGroupCtx | null>(null);
export const useGroup = () => useContext(GroupContext)!;

export function GroupProvider(
  props: GroupIdPageProps & React.PropsWithChildren
) {
  const {
    children,
    group: providedGroup,
    institution: providedInstitution,
    trainings: allTrainings,
  } = props;

  const { users: allUsers, setTrainings } = useMain();

  // state for selected items
  const [filter, setFilter] = useState<GroupDateFilter>('day');
  const [group, setGroup] = useState<Group>(providedGroup);
  const [selectedGroup, setSelectedGroup] = useState({ ...group });
  const [institution, setInstitution] =
    useState<Institution>(providedInstitution);

  // find the cycle which is in the current date, else undefined:
  const todaysCycle = group.cycles.find((c) =>
    lib.common.date.isBetween(dayjs(), c.from, c.to)
  );

  const [cycle, setCycle] = useState<Cycle | undefined>(todaysCycle);
  const [dateFrom, setDateFrom] = useState(dayjs().startOf('day'));
  const [dateTo, setDateTo] = useState(dayjs().endOf('day'));
  const [detectedChanges, setDetectedChanges] = useState(false);

  // state for arrays
  const [filteredUsers, setFilteredUsers] = useState(() => allUsers.data);

  async function handleMoveTraining(e: DragEndEvent) {
    const { over, active } = e;
    if (!over) return;

    // Dragged training
    const training = active.data.current?.training;
    if (!training) return;

    // Dropped cell
    const payload = over.data.current;
    if (!payload) return;

    const { date, period } = payload;
    const isPm = period === 'PM';
    const startHour = isPm ? 18 : 9;
    const endHour = isPm ? 20 : 11;

    const newFrom = dayjs(date).hour(startHour).minute(0).second(0).toDate();
    const newTo = dayjs(date).hour(endHour).minute(0).second(0).toDate();

    const duration = 30; // 30 min per component default
    const state = { trainings: structuredClone(allTrainings) };
    await lib.common.generic.optimisticUpdate(
      () =>
        setTrainings((prev) => ({
          ...prev,
          data: prev.data.map((t) =>
            t.id === training.id
              ? {
                  ...t,
                  from: newFrom,
                  to: addMinutes(
                    newFrom,
                    training.components.length * duration
                  ),
                  components: t.components.map((c, i) => ({
                    ...c,
                    from: addMinutes(newFrom, i * duration),
                    to: addMinutes(newFrom, (i + 1) * duration),
                  })),
                }
              : t
          ),
        })),
      (snapshot) =>
        setTrainings((prev) => ({ ...prev, data: snapshot.trainings })),
      async () =>
        await TrainingController.getInstance().move(training.id, {
          from: newFrom,
          to: newTo,
        }),
      state,
      (training) => {
        if (!training?.id) return;
        setTrainings((prev) => ({
          ...prev,
          data: prev.data.map((t) => (t.id === training.id ? training : t)),
        }));
      }
    );
  }

  // filter trainings by cycle
  useEffect(() => {
    if (!cycle) return;
    setDateFrom(dayjs(cycle.from));
    setDateTo(dayjs(cycle.to));
  }, [cycle]);

  const value: IGroupCtx = {
    filter,
    setFilter,
    institution,
    setInstitution,
    group,
    setGroup,
    selectedGroup,
    setSelectedGroup,
    cycle,
    setCycle,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    trainings: allTrainings,
    filteredUsers,
    setFilteredUsers,
    detectedChanges,
    setDetectedChanges,
    handleMoveTraining,
  };

  return (
    <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
  );
}
