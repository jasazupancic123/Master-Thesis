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
import { Firestore } from '@/util/firebase';
import toast from 'react-hot-toast';

function Page() {
  // context
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role } = useAuth() as AuthContextType;
  const { token, components } = useAppContext() as AppContextType;

  // state
  const [users, loadingUsers, errorUsers, _refetchUsers, setUsers] = useFetch<User[]>(FitcodeApi.URL.users());
  const [groups, loadingGroups, errorGroups, _refetchGroups, setGroups] = useFetch<Group[]>(FitcodeApi.URL.groups());
  const [filter, setFilter] = useState<TrainingFilter>('year');
  const [date, setDate] = useState({
    start: dayjs().startOf('year'),
    end: dayjs().endOf('year'),
    custom: false,
  });

  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState({
    group: null as Group | null,
    subgroup: null as Group | null,
    cycles: [] as Cycle[], // all cycles for a group / subgroup
    cycle: null as Cycle | null, // selected cycle
    trainings: [] as Training[], // selected cycle trainings
  });

  /**
   * If group id is not provided, reset all other selected items, otherwise
   * fetch group and its cycles and set other selected items to null
   */
  async function fetchGroup(groupId: string | null) {
    if (!groupId) {
      setSelected({ group: null, subgroup: null, cycle: null, cycles: [], trainings: [] });
      return;
    }

    try {
      const group = await FitcodeApi.getGroup(groupId, token);
      const cycles = await FitcodeApi.getAllCycles(token, { groupId: group.id });

      setSelected({ group, cycles, subgroup: null, cycle: null, trainings: [] });
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Error fetching group');
    }
  }

  function findSubgroup(subgroupId: string | null) {
    const subgroup = subgroupId ? (selected.group?.subgroups || []).find(subgroup => subgroup.id === subgroupId) || null : null;
    setSelected(prev => ({ ...prev, subgroup }));
  }

  /**
   * Fetch cycle and its trainings
   */
  async function fetchCycle(cycleId: string | null) {
    if (!cycleId) {
      setSelected(prev => ({ ...prev, cycle: null, trainings: [] }));
      return;
    }

    try {
      const cycle = await FitcodeApi.getCycle(cycleId, token);
      const response = await FitcodeApi.findAllTrainings(token, {
        cycleId: cycle.id,
        subgroupId: selected.subgroup?.id,
        startTime: date.start.toISOString(),
        endTime: date.end.toISOString(),
      });

      const trainings = response.map(training => Firestore.populateTraining(training, components.flat));
      setSelected({ ...selected, cycle, trainings });
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Error fetching cycle');
    }
  }

  async function fetchTrainings(cycleId: string, subgroupId?: string) {
    if (!cycleId) {
      setSelected(prev => ({ ...prev, trainings: [] }));
      return;
    }

    try {
      const response = await FitcodeApi.findAllTrainings(token, {
        cycleId,
        subgroupId,
        startTime: date.start.toISOString(),
        endTime: date.end.toISOString(),
      });

      const trainings = response.map(training => Firestore.populateTraining(training, components.flat));
      setSelected({ ...selected, trainings });
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Error fetching trainings');
    }
  }

  // TODO - get initial data based on query params

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
        if (!props.selected.cycle) {
          start = today.startOf('week');
          end = today.endOf('week');
        } else {
          const week = props.selected.cycle.weeks?.[0] || getWeekDays();
          start = dayjs(week[0].date!).startOf('day');
          end = dayjs(week[6].date!).endOf('day');
        }

        break;
      case 'day':
        start = today.startOf('day');
        end = today.endOf('day');
        break;
      default:
        start = today.startOf('year');
        end = today.endOf('year');
    }

    if (date.custom) {
      start = date.start;
      end = date.end;
    }

    setDate({ ...date, start, end });
  }, [searchParams.get('filter'), selected.cycle?.id]);

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
   * Fetch group and its cycles when groupId param changes
   */
  useEffect(() => {
    setLoading(true);
    fetchGroup(searchParams.get('groupId')).finally(() => setLoading(false));
  }, [searchParams.get('groupId')]);

  /**
   * Fetch subgroup when subgroupId param changes
   */
  useEffect(() => {
    if (selected.group) findSubgroup(searchParams.get('subgroupId'));
  }, [searchParams.get('subgroupId')]);

  /**
   * Fetch cycle and its trainings when cycleId param changes (and group is
   * selected)
   */
  useEffect(() => {
    if (selected.group) {
      setLoading(true);
      fetchCycle(searchParams.get('cycleId')).finally(() => setLoading(false));
    }
  }, [searchParams.get('cycleId'), selected.subgroup?.id]);

  /**
   * Filter trainings for cycle based on date range
   */
  useEffect(() => {
    if (selected.cycle) {
      setLoading(true);
      fetchTrainings(selected.cycle.id, selected.subgroup?.id).finally(() => setLoading(false));
    }
  }, [date.start, date.end, selected.subgroup?.id]);

  if (loadingUsers || loadingGroups)
    return <div>Loading...</div>;

  if (errorUsers || errorGroups || !users || !groups)
    return <div>Error</div>;

  const props: GroupPageProps = {
    selected,
    setSelected,
    loading,
    setLoading,
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