'use client';

import {
  CommonContextType,
  DetectChangesContextType,
} from '@/common/type/context.type';
import { ChildrenProps } from '@/common/type/props.type';
import { SetState } from '@/common/type/state.type';
import { Institution } from '@/controller/institution/type/institution.type';
import { User } from '@/controller/user/type/user.type';
import { createContext, useContext, useState } from 'react';

export interface DashboardPageProps extends CommonContextType {
  institutions: Institution[];
  users: User[];
}

interface DashboardContextProps extends DetectChangesContextType {
  institution: Institution; // selected institution
  setInstitution: SetState<Institution>;
}

const DashboardContext = createContext<
  (DashboardPageProps & DashboardContextProps) | null
>(null);

export const useDashboard = () => useContext(DashboardContext)!;

export function DashboardProvider(props: ChildrenProps & DashboardPageProps) {
  const { children, token, user, institutions, users } = props;

  const [detectedChanges, setDetectedChanges] = useState(false);
  const [institution, setInstitution] = useState(institutions[0]);

  const value: DashboardPageProps & DashboardContextProps = {
    token,
    user,
    institutions,
    users,
    detectedChanges,
    setDetectedChanges,
    institution,
    setInstitution,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
