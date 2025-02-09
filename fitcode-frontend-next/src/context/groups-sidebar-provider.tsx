'use client'; // Ensure it's a Client Component

import React, { createContext, useContext, useState } from 'react';
import { useFetch } from '@/hook/use-fetch';
import type { Group } from '@/group/entity/group.entity';
import type { Cycle } from '@/group/entity/cycle.entity';
import type { User } from '@/user/type/user.type';
import type { FilterType } from '@/group/type/filter.type';
import type { Subgroup } from '@/group/entity/subgroup.entity';
import { Dayjs } from 'dayjs';
import dayjs from 'dayjs'; // ✅ Import correctly

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

export type GroupPageSidebarContextType = {
  loading: boolean;
  setLoading: SetState<boolean>;
  users: ReturnType<typeof useFetch<User[]>>;
  groups: ReturnType<typeof useFetch<Group[]>>;
  filter: FilterType;
  setFilter: SetState<FilterType>;
  selected: {
    group: Group | null;
    subgroup: Subgroup | null;
    cycle: Cycle | null;
  };
  setSelected: SetState<GroupPageSidebarContextType['selected']>;
  date: { start: Dayjs; end: Dayjs; custom: boolean };
  setDate: SetState<GroupPageSidebarContextType['date']>;
  modal: { add_group: boolean; members: boolean; settings: boolean };
  setModal: SetState<GroupPageSidebarContextType['modal']>;
};

const GroupSidebarContext = createContext<GroupPageSidebarContextType | null>(
  null
);

export const useGroupSidebar = () => {
  const context = useContext(GroupSidebarContext);
  if (!context) {
    throw new Error('useGroupSidebar must be used within GroupSidebarProvider');
  }
  return context;
};

export const GroupSidebarProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [loading, setLoading] = useState(false);
  const users = useFetch<User[]>('/user');
  const groups = useFetch<Group[]>('/group');
  const [filter, setFilter] = useState<FilterType>('week');
  const [selected, setSelected] = useState<{
    group: Group | null;
    subgroup: Subgroup | null;
    cycle: Cycle | null;
  }>({
    group: null,
    subgroup: null,
    cycle: null,
  });

  const [date, setDate] = useState<{
    start: Dayjs;
    end: Dayjs;
    custom: boolean;
  }>({
    start: dayjs(),
    end: dayjs(),
    custom: false,
  });

  const [modal, setModal] = useState<{
    add_group: boolean;
    members: boolean;
    settings: boolean;
  }>({
    add_group: false,
    members: false,
    settings: false,
  });

  return (
    <GroupSidebarContext.Provider
      value={{
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
        modal,
        setModal,
      }}
    >
      {children}
    </GroupSidebarContext.Provider>
  );
};
