'use client';

import dayjs from 'dayjs';
import { createContext, useContext, useState } from 'react';

import { useMain } from './main.provider';
import type {
  GroupContextProps,
  GroupIdPageProps,
} from '@/app/(trainer)/groups/[group_id]/props';
import { CommonService } from '@/common/service/common.service';
import type { GroupDateFilter } from '@/common/type/filter.type';
import type { ChildrenProps } from '@/common/type/props.type';
import type { Cycle } from '@/controller/group/type/cycle.type';
import type { Group } from '@/controller/group/type/group.type';
import type { Institution } from '@/controller/institution/type/institution.type';

const dateService = CommonService.instance.date;

const GroupContext = createContext<GroupContextProps | null>(null);

export const useGroup = () => useContext(GroupContext)!;

export function GroupProvider(props: GroupIdPageProps & ChildrenProps) {
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
  const [institution, setInstitution] =
    useState<Institution>(providedInstitution);

  // find the cycle which is in the current date, else undefined:
  const todaysCycle = group.cycles.find((c) =>
    dateService.isBetween(dayjs(), c.from, c.to)
  );
  const [cycle, setCycle] = useState<Cycle | undefined>(todaysCycle);
  const [dateFrom, setDateFrom] = useState(dayjs().startOf('day'));
  const [dateTo, setDateTo] = useState(dayjs().endOf('day'));
  const [detectedChanges, setDetectedChanges] = useState(false);

  // state for arrays
  const [trainings, setTrainings] = useState(allTrainings);
  const [filteredUsers, setFilteredUsers] = useState(allUsers);

  const value: GroupContextProps = {
    filter,
    setFilter,
    institution,
    setInstitution,
    group,
    setGroup,
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
