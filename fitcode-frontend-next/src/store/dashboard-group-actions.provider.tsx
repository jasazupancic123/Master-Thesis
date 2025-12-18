'use client';

import { createContext, useContext, useState } from 'react';

import type { Group } from '@/core/institution/type/group.type';
import type { SetState } from '@/lib/common/type/state.type';

interface IDashboardGroupActionsContext {
  openEditGroupModal: boolean;
  setOpenEditGroupModal: SetState<boolean>;
  openDeleteGroupModal: boolean;
  setOpenDeleteGroupModal: SetState<boolean>;
  groupToEdit: Group | null;
  setGroupToEdit: SetState<Group | null>;
  groupToDelete: Group | null;
  setGroupToDelete: SetState<Group | null>;
}

const DashboardGroupActionsContext =
  createContext<IDashboardGroupActionsContext | null>(null);

export const useDashboardGroupActions = () =>
  useContext(DashboardGroupActionsContext)!;

export function DashboardGroupActionsProvider(props: React.PropsWithChildren) {
  const { children } = props;

  const [openEditGroupModal, setOpenEditGroupModal] = useState(false);
  const [openDeleteGroupModal, setOpenDeleteGroupModal] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<Group | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);

  const value: IDashboardGroupActionsContext = {
    openEditGroupModal,
    setOpenEditGroupModal,
    openDeleteGroupModal,
    setOpenDeleteGroupModal,
    groupToEdit,
    setGroupToEdit,
    groupToDelete,
    setGroupToDelete,
  };

  return (
    <DashboardGroupActionsContext.Provider value={value}>
      {children}
    </DashboardGroupActionsContext.Provider>
  );
}
