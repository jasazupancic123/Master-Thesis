'use client';

import { useFetch } from '@/hook/use-fetch';
import withAuth from '@/components/with-auth';
import React, { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-provider';
import { useAppContext } from '@/context/app-provider';
import dayjs, { Dayjs } from 'dayjs';
import toast from 'react-hot-toast';
import { CommonService } from '@/common/service/common.service';
import TrainerPageRouter from '@/app/groups/components/trainer-page-router';
import AthletePageRouter from '@/app/groups/components/athlete-page-router';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { User } from '@/controller/user/type/user.type';
import { Group } from '@/controller/group/type/group.type';
import { FilterType } from '@/common/type/filter.type';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { Cycle } from '@/controller/group/type/cycle.type';
import { GroupController } from '@/controller/group/group.controller';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import { UserRole } from '@/controller/user/enum/user-role.enum';

function Page() {
  // context
  const { role } = useAuth();
  const { token, components } = useAppContext();
  const allExercises = useFetch<Exercise[]>('/exercise');

  // state
  const [loading, setLoading] = useState(false);
  const users = useFetch<User[]>('/user');
  const groups = useFetch<Group[]>('/group');

  const [filter, setFilter] = useState<FilterType>('year');
  const [date, setDate] = useState({
    start: dayjs().startOf('year'),
    end: dayjs().endOf('year'),
    custom: false,
  });

  const [selected, setSelected] = useState({
    group: null as Group | null,
    subgroup: null as Subgroup | null,
    cycle: null as Cycle | null,
  });

  const props = {
    loading,
    setLoading,
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

      const { group } = selected;
      try {
        const response = await GroupController.findById(token, group.id);
        setSelected({ group: response, subgroup: null, cycle: null });
      } catch (e: any) {
        console.error(e);
        toast.error(e.message || 'Error fetching group');
      }
    }

    fetchGroup().then();
  }, [selected.group?.id, token]);

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
        props.setSelected((prev) => ({ ...prev, subgroup: null }));
        start = today.startOf('year');
        end = today.endOf('year');
        break;
      case 'cycle':
        props.setSelected((prev) => ({ ...prev, subgroup: null }));

        if (!props.selected.cycle) {
          const week = CommonService.instance.date.getWeekDays();
          start = week[0].date.startOf('day');
          end = week[6].date.endOf('day');
        } else {
          start = dayjs(props.selected.cycle.from).startOf('week');
          end = dayjs(props.selected.cycle.to).endOf('week');
        }

        break;
      case 'week':
        props.setSelected((prev) => ({ ...prev, subgroup: null }));

        if (!props.selected.cycle) {
          start = today.startOf('week');
          end = today.endOf('week');
        } else {
          const week =
            props.selected.cycle.weeks?.[0] ||
            CommonService.instance.date.getWeekDays();
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
  }, [filter, selected.cycle?.id]);

  /**
   * Filter trainings and subgroups
   */
  useEffect(() => {
    const { group, cycle, subgroup } = selected;
    if (!group || !cycle) return;

    async function fetchTrainings() {
      setLoading(true);

      try {
        let response = await TrainingController.findAll(token, {
          groupId: group!.id,
          cycleId: cycle!.id,
          from: date.start.toDate(),
          to: date.end.toDate(),
        });

        response.map((training) => {
          TrainingService.mapComponents(training, components.flat);
          TrainingService.mapExercises(training, allExercises.data!);
        });

        setSelected((prev) => ({
          ...prev,
          cycle: { ...prev.cycle!, trainings: response },
        }));
      } catch (e: any) {
        console.error(e);
        toast.error(e.message || 'Error fetching trainings');
      } finally {
        setLoading(false);
      }
    }

    fetchTrainings().then();
  }, [
    token,
    date.start,
    date.end,
    selected.group?.id,
    selected.cycle?.id,
    selected.subgroup?.id,
  ]);

  useEffect(() => {
    if (selected.subgroup && date.custom)
      setSelected((prev) => ({ ...prev, subgroup: null }));
  }, [date.start, date.end]);

  if (users.loading || groups.loading) return <div>Loading...</div>;

  if (users.error || groups.error) return <div>Error</div>;

  const mapper: Record<UserRole, ReactNode> = {
    [UserRole.ADMIN]: <div>Admin</div>,
    [UserRole.MANAGER]: <div>Manager</div>,
    [UserRole.TRAINER]: <TrainerPageRouter {...props} />,
    [UserRole.ATHLETE]: <AthletePageRouter {...props} />,
  };

  return mapper[role[0] as UserRole];
}

export default withAuth(Page);
