'use client';

import {
  GroupContextProps,
  GroupIdPageProps,
} from '@/app/groups/[group_id]/props';
import { GroupDateFilter } from '@/common/type/filter.type';
import { ChildrenProps } from '@/common/type/props.type';
import { Component } from '@/controller/component/type/component.type';
import { Cycle } from '@/controller/group/type/cycle.type';
import { Group } from '@/controller/group/type/group.type';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { Training } from '@/controller/training/type/training.type';
import dayjs from 'dayjs';
import { createContext, useContext, useState } from 'react';

const GroupContext = createContext<GroupContextProps | null>(null);

export const useGroup = () => useContext(GroupContext)!;

export function GroupProvider(props: GroupIdPageProps & ChildrenProps) {
  const {
    children,
    token,
    users,
    components,
    attributes,
    exercises,
    groups,
    group: providedGroup,
    trainings: allTrainings,
  } = props;

  // state for selected items
  const [filter, setFilter] = useState<GroupDateFilter>('day');
  const [group, setGroup] = useState<Group>(providedGroup);
  const [cycle, setCycle] = useState<Cycle | null>(group.cycles[0] || null);
  const [component, setComponent] = useState<Component | null>(null);
  const [training, setTraining] = useState<Training | null>(null);
  const [subgroup, setSubgroup] = useState<Subgroup | null>(null);
  const [dateFrom, setDateFrom] = useState(dayjs().startOf('day'));
  const [dateTo, setDateTo] = useState(dayjs().endOf('day'));

  // state for arrays
  const [filteredTrainings, setFilteredTrainings] = useState(allTrainings);
  const [filteredUsers, setFilteredUsers] = useState(users);

  const value: GroupContextProps = {
    token,
    users,
    groups,
    components,
    attributes,
    exercises,
    filter,
    setFilter,
    group,
    setGroup,
    cycle,
    setCycle,
    component,
    setComponent,
    training,
    setTraining,
    subgroup,
    setSubgroup,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    trainings: allTrainings,
    filteredTrainings,
    setFilteredTrainings,
    filteredUsers,
    setFilteredUsers,
  };

  return (
    <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
  );
}
