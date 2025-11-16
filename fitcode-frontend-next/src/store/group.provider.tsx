'use client';

import type { DragEndEvent } from '@dnd-kit/core';
import dayjs from 'dayjs';
import { createContext, useContext, useEffect, useState } from 'react';

import { useMain } from './main.provider';
import type {
  GroupContextProps,
  GroupIdPageProps,
} from '@/app/(trainer)/groups/[group_id]/props';
import type { Cycle } from '@/core/group/type/cycle.type';
import type { Group } from '@/core/group/type/group.type';
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

  const { users: allUsers } = useMain();

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
  const [trainings, setTrainings] = useState(allTrainings);
  const [filteredUsers, setFilteredUsers] = useState(allUsers);

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

    const state = { trainings: structuredClone(trainings) };
    await lib.common.generic.optimisticUpdate(
      () =>
        setTrainings((prev) =>
          prev.map((t) =>
            t.id === training.id ? { ...t, from: newFrom, to: newTo } : t
          )
        ),
      (snapshot) => setTrainings(snapshot.trainings),
      async () =>
        await TrainingController.getInstance().move(training.id, {
          from: newFrom,
          to: newTo,
        }),
      state
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
    trainings,
    setTrainings,
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
