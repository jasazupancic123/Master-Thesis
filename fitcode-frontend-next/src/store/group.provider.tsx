'use client';

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
import { lib } from '@/lib';
import type { GroupDateFilter } from '@/lib/common/type/filter.type';

const GroupContext = createContext<GroupContextProps | null>(null);
export const useGroup = () => useContext(GroupContext)!;

export type IGroupCtx = ReturnType<typeof useGroup>;

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

  // filter trainings by cycle
  useEffect(() => {
    if (!cycle) return;
    setDateFrom(dayjs(cycle.from));
    setDateTo(dayjs(cycle.to));
  }, [cycle]);

  const value: GroupContextProps = {
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
  };

  return (
    <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
  );
}
