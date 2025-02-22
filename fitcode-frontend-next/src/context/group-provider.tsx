'use client';

import {
  GroupContextProps,
  GroupIdPageProps,
} from '@/app/groups/[group_id]/props';
import { CommonService } from '@/common/service/common.service';
import { GroupDateFilter } from '@/common/type/filter.type';
import { ChildrenProps } from '@/common/type/props.type';
import { handleApiRequest } from '@/common/type/state.type';
import { Component } from '@/controller/component/type/component.type';
import { GroupController } from '@/controller/group/group.controller';
import { Cycle } from '@/controller/group/type/cycle.type';
import { Group } from '@/controller/group/type/group.type';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { TrainingComponent } from '@/controller/training/type/training-plan.type';
import { Training } from '@/controller/training/type/training.type';
import { User } from '@/controller/user/type/user.type';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import router from 'next/router';
import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const dateService = CommonService.instance.date;

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

  const router = useRouter();

  // state for selected items
  const [filter, setFilter] = useState<GroupDateFilter>('day');
  const [group, setGroup] = useState<Group>(providedGroup);
  const [cycle, setCycle] = useState<Cycle | undefined>(group.cycles[0]);
  const [component, setComponent] = useState<TrainingComponent | undefined>();
  const [training, setTraining] = useState<Training | undefined>();
  const [dateFrom, setDateFrom] = useState(dayjs().startOf('day'));
  const [dateTo, setDateTo] = useState(dayjs().endOf('day'));

  // state for arrays
  const [trainings, setTrainings] = useState(allTrainings);
  const [filteredTrainings, setFilteredTrainings] = useState(allTrainings);
  const [filteredUsers, setFilteredUsers] = useState(users);
  const [selectedAthlete, setSelectedAthlete] = useState<User | undefined>();

  const [selectedSubgroup, setSelectedSubgroup] = useState<{
    subgroup: Subgroup | null;
    index: number;
  } | null>(null);

  const [detectedChanges, setDetectedChanges] = useState(false);

  async function handleUpdateGroup() {
    if (!group) return;

    await handleApiRequest(
      router,
      () => GroupController.update(token, group.id, group),
      (newGroup) => {
        setGroup(newGroup);
        setDetectedChanges(false);
        toast.success('Group updated successfully');
      },
      undefined,
      'Error when updating group'
    );
  }

  async function handleUpdateTraining() {
    if (!training) return;

    await handleApiRequest(
      router,
      () => TrainingController.update(token, training.id, training),
      (newTraining) => {
        let mapped = TrainingService.mapComponents(newTraining, components);
        mapped = TrainingService.mapExercises(newTraining, exercises);

        if (training && newTraining.id === training.id) setTraining(mapped);
        setTrainings((prev) =>
          prev.map((t) => (t.id === newTraining.id ? mapped : t))
        );

        setFilteredTrainings((prev) =>
          prev.map((t) => (t.id === newTraining.id ? mapped : t))
        );

        setDetectedChanges(false);
        toast.success('Training updated successfully');
      },
      undefined,
      'Error when updating training'
    );
  }

  // filter trainings every time date changes
  useEffect(() => {
    setFilteredTrainings(
      trainings.filter(
        (t) =>
          dateService.isBetween(t.from, dateFrom, dateTo) &&
          (cycle ? t.cycleId === cycle.id : true)
      )
    );

    setTraining(undefined);
    setSelectedSubgroup(null);
    setComponent(undefined);
    setSelectedAthlete(undefined);
  }, [cycle, dateFrom, dateTo]);

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
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    trainings,
    setTrainings,
    filteredTrainings,
    setFilteredTrainings,
    filteredUsers,
    setFilteredUsers,
    selectedSubgroup,
    setSelectedSubgroup,
    selectedAthlete,
    setSelectedAthlete,
    detectedChanges,
    setDetectedChanges,
    handleUpdateGroup,
    handleUpdateTraining,
  };

  return (
    <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
  );
}
