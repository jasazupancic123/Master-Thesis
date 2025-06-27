'use client';

import {
  GroupContextProps,
  GroupIdPageProps,
} from '@/app/groups/[group_id]/props';
import { CommonService } from '@/common/service/common.service';
import { GroupDateFilter } from '@/common/type/filter.type';
import { ChildrenProps } from '@/common/type/props.type';
import { Cycle } from '@/controller/group/type/cycle.type';
import { Group } from '@/controller/group/type/group.type';
import { Institution } from '@/controller/institution/type/institution.type';
import dayjs from 'dayjs';
import { createContext, useContext, useState } from 'react';

const dateService = CommonService.instance.date;

const GroupContext = createContext<GroupContextProps | null>(null);

export const useGroup = () => useContext(GroupContext)!;

export function GroupProvider(props: GroupIdPageProps & ChildrenProps) {
  const {
    children,
    userId,
    token,
    users: allUsers,
    components,
    attributes,
    exercises,
    groups,
    group: providedGroup,
    institution: providedInstitution,
    trainings: allTrainings,
    methods,
  } = props;

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
  const [users, setUsers] = useState(allUsers);
  const [trainings, setTrainings] = useState(allTrainings);
  const [filteredUsers, setFilteredUsers] = useState(allUsers);

  const value: GroupContextProps = {
    token,
    userId,
    users,
    setUsers,
    groups,
    components,
    attributes,
    exercises,
    methods,
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
