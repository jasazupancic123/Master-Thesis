'use client';

import { useFetch } from '@/hook/use-fetch';
import type { User } from '@/user/type/user.type';
import { UserRole } from '@/user/enum/user-role.enum';
import TrainerPageRouter from './components/trainer-page-router';
import withAuth from '@/common/components/with-auth';
import React, { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-provider';
import type { Group } from '@/group/entity/group.entity';
import type { Cycle } from '@/group/entity/cycle.entity';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppContext } from '@/context/app-provider';
import type { TrainingFilter } from '@/app/groups/components/training-filter';
import dayjs, { Dayjs } from 'dayjs';
import toast from 'react-hot-toast';
import type { AppContextType, AuthContextType } from '@/common/type/context.type';
import type { GroupPageProps } from '@/group/type/props.type';
import { UserController } from '@/user/user.controller';
import { GroupController } from '@/group/group.controller';
import { Subgroup } from '@/group/entity/subgroup.entity';
import { CommonService } from '@/common/service/common.service';

function Page() {
  // context
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role } = useAuth() as AuthContextType;
  const { token } = useAppContext() as AppContextType;

  // state
  const users = useFetch<User[]>(UserController.URL.users());
  const groups = useFetch<Group[]>(GroupController.URL.groups());
  const [filter, setFilter] = useState<TrainingFilter>('year');
  const [date, setDate] = useState({
    start: dayjs().startOf('year'),
    end: dayjs().endOf('year'),
    custom: false,
  });

  const [selected, setSelected] = useState<GroupPageProps['selected']>({
    group: null as Group | null,
    subgroup: null as Subgroup | null,
    cycle: null as Cycle | null,
  });

  const props: GroupPageProps = {
    users,
    groups,
    filter,
    setFilter,
    selected,
    setSelected,
    date,
    setDate,
  };

  /**
   * If group id is not provided, reset all other selected items, otherwise
   * fetch group and its cycles and set other selected items to null
   */
  useEffect(() => {
    async function fetchGroup() {
      if (!selected.group?.id) {
        setSelected({ group: null, subgroup: null, cycle: null });
        return;
      }

      try {
        const group = await GroupController.findGroup(token, selected.group.id);
        setSelected({ group, subgroup: null, cycle: null });
      } catch (e: any) {
        console.error(e);
        toast.error(e.message || 'Error fetching group');
      }
    }

    fetchGroup().then();
  }, [searchParams, selected.group?.id, token]);

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
  }, [router, selected.group, selected.subgroup, selected.cycle, filter]);

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
          const week = CommonService.instance.date.getWeekDays();
          start = week[0].date.startOf('day');
          end = week[6].date.endOf('day');
        } else {
          start = dayjs(props.selected.cycle.from).startOf('day');
          end = dayjs(props.selected.cycle.to).endOf('day');
        }

        break;
      case 'week':
        if (!props.selected.cycle) {
          start = today.startOf('week');
          end = today.endOf('week');
        } else {
          const week = props.selected.cycle.weeks?.[0] || CommonService.instance.date.getWeekDays();
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
  }, [date, filter, selected.cycle, props.selected.cycle]);

  /**
   * Filter trainings for cycle based on date range
   */
  useEffect(() => {
    if (!selected.cycle)
      return;

    const cycleId = selected.cycle.id;
    const allTrainings = selected.group?.cycles?.find(({ id }) => id === cycleId)?.trainings || [];

    const filteredTrainings = allTrainings.filter(training =>
      CommonService.instance.date.isBetween(dayjs(training.from), date.start, date.end) && training.subgroupId === (selected.subgroup?.id || null),
    );

    setSelected(prev => ({ ...prev, cycle: { ...prev.cycle!, trainings: filteredTrainings } }));
  }, [selected, date.start, date.end, selected.subgroup?.id]);

  if (users.loading || groups.loading)
    return <div>Loading...</div>;

  if (users.error || groups.error)
    return <div>Error</div>;

  const mapper: Record<UserRole, ReactNode> = {
    [UserRole.ADMIN]: <div>Admin</div>,
    [UserRole.MANAGER]: <div>Manager</div>,
    [UserRole.TRAINER]: <TrainerPageRouter {...props} />,
    [UserRole.ATHLETE]: <div>Athlete</div>,
  };

  return mapper[role[0]];
}

export default withAuth(Page);