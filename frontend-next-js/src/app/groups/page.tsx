'use client';

import { useFetch } from '@/hook/use-fetch';
import { User } from '@/type/user.type';
import { UserRole } from '@/enum/user-role.enum';
import TrainerPageRouter from './components/trainer-page-router';
import withAuth from '@/hoc/with-auth';
import React, { ReactNode, useEffect, useState } from 'react';
import { FitcodeApi } from '@/util/api';
import { AuthContextType, useAuth } from '@/context/auth-provider';
import { Group } from '@/type/group.type';
import { Cycle } from '@/type/cycle.type';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppContextType, useAppContext } from '@/context/app-provider';
import { TrainingFilter } from '@/app/groups/components/training-filter';
import { Training } from '@/type/training.type';
import dayjs, { Dayjs } from 'dayjs';
import { getWeekDays } from '@/util/date';
import { GroupPageProps } from '@/app/groups/props';

function Page() {
  // context
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role } = useAuth() as AuthContextType;
  const { token } = useAppContext() as AppContextType;

  // state
  const [users, loadingUsers, errorUsers, _refetchUsers, setUsers] = useFetch<User[]>(FitcodeApi.URL.users());
  const [groups, loadingGroups, errorGroups, _refetchGroups, setGroups] = useFetch<Group[]>(FitcodeApi.URL.groups());
  const [filter, setFilter] = useState<TrainingFilter>('year');
  const [date, setDate] = useState({
    start: dayjs().startOf('year'),
    end: dayjs().endOf('year'),
    custom: false,
  });

  const [selected, setSelected] = useState({
    group: null as Group | null,
    subgroup: null as Group | null,
    cycles: [] as Cycle[], // all cycles for a group / subgroup
    cycle: null as Cycle | null, // selected cycle
    trainings: [] as Training[], // selected cycle trainings
  });

  /**
   * When group changes, keep only group and its cycles selected
   */
  useEffect(() => {
    setSelected(prev => ({
      ...prev,
      subgroup: null,
      cycle: null,
      trainings: [],
    }));
  }, [selected.group?.id]);

  /**
   * Fetch selected items if search params are present
   */
  useEffect(() => {
    async function fetchData() {
      const params = {
        groupId: searchParams.get('groupId'),
        subgroupId: searchParams.get('subgroupId'),
        cycleId: searchParams.get('cycleId'),
        filter: searchParams.get('filter') as TrainingFilter,
      };

      if (!params.groupId) {
        // show only all groups
        setSelected({ group: null, subgroup: null, cycle: null, cycles: [], trainings: [] });
        return;
      }

      try {
        const group = await FitcodeApi.getGroup(params.groupId, token);
        const cycles = await FitcodeApi.getAllCycles(token, { groupId: group.id });

        let subgroup: Group | null = null;
        let cycle: Cycle | null = null;
        let trainings: Training[] = [];

        if (params.subgroupId) {
          subgroup = (group.subgroups || []).find(subgroup => subgroup.id === params.subgroupId) || null;
        }

        if (params.cycleId) {
          cycle = await FitcodeApi.getCycle(params.cycleId, token);
          trainings = await FitcodeApi.findAllTrainings(token, {
            cycleId: cycle.id,
            subgroupId: subgroup?.id,
            startDate: date.start.toISOString(),
            endDate: date.end.toISOString(),
          });
        }

        setSelected({ ...selected, group, cycles, subgroup, cycle, trainings });
      } catch (e) {
        console.error(e);
      }
    }

    fetchData().then();
  }, [
    searchParams.get('groupId'),
    searchParams.get('subgroupId'),
    searchParams.get('cycleId'),
    searchParams.get('filter'),
  ]);

  /*useEffect(() => {
    if (!selected.cycle)
      return;

    async function fetchTrainings() {
      const trainings = await FitcodeApi.findAllTrainings(token, {
        cycleId: selected.cycle!.id,
        subgroupId: selected.subgroup?.id,
        startDate: dayjs(selected.cycle!.startDate).toISOString(),
        endDate: dayjs(selected.cycle!.endDate).toISOString(),
      });

      setSelected(prev => ({ ...prev, trainings }));
    }

    fetchTrainings().then();
  }, [selected.cycle?.id]);*/

  /**
   * Add query to url when selected items change
   */
  useEffect(() => {
    const params = new URLSearchParams();

    if (selected.group) params.set('groupId', selected.group.id);
    if (selected.subgroup) params.set('subgroupId', selected.subgroup.id);
    if (selected.cycle) params.set('cycleId', selected.cycle.id);
    params.set('filter', filter);

    router.replace(`?${params.toString()}`);
  }, [selected.group, selected.subgroup, selected.cycle, filter]);

  /**
   * Filter date range based on provided filters
   */
  useEffect(() => {
    // filter trainings based on filter date range
    const today = dayjs();
    let start: Dayjs;
    let end: Dayjs;

    switch (filter) {
      case 'year':
        start = today.startOf('year');
        end = today.endOf('year');
        break;
      case 'cycle':
        if (!props.selected.cycle) {
          const week = getWeekDays();
          start = week[0].date.startOf('day');
          end = week[6].date.endOf('day');
        } else {
          start = dayjs(props.selected.cycle.startDate).startOf('day');
          end = dayjs(props.selected.cycle.endDate).endOf('day');
        }

        break;
      case 'week':
        start = today.startOf('week');
        end = today.endOf('week');
        break;
      case 'day':
        start = today.startOf('day');
        end = today.endOf('day');
        break;
    }

    if (date.custom) {
      start = date.start;
      end = date.end;
    }

    setDate({ ...date, start, end });
  }, [filter]);

  if (loadingUsers || loadingGroups)
    return <div>Loading...</div>;

  if (errorUsers || errorGroups || !users || !groups)
    return <div>Error</div>;

  const props: GroupPageProps = {
    selected,
    setSelected,
    users,
    setUsers,
    groups,
    setGroups,
    filter,
    setFilter,
    date,
    setDate,
  };

  const mapper: Record<UserRole, ReactNode> = {
    [UserRole.ADMIN]: <div>Admin</div>,
    [UserRole.MANAGER]: <div>Manager</div>,
    [UserRole.TRAINER]: <TrainerPageRouter {...props} />,
    [UserRole.ATHLETE]: <div>Athlete</div>,
  };

  return mapper[role];
}

export default withAuth(Page);