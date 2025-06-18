'use client';

import { BACKEND_API_BASE_URL } from '@/common/constant/api.constant';
import { useFetch } from '@/common/hooks/use-fetch.hook';
import { ChildrenProps } from '@/common/type/props.type';
import { SetState } from '@/common/type/state.type';
import { Group } from '@/controller/group/type/group.type';
import { Institution } from '@/controller/institution/type/institution.type';
import { User } from '@/controller/user/type/user.type';
import { url } from 'inspector';
import { createContext, useContext, useEffect, useState } from 'react';

interface DashboardContextProps {
  role: string;
  token: string;
  profile: User;
  institutions: Institution[];
  setInstitutions: SetState<Institution[]>;
  selectedInstitution: Institution | null;
  setSelectedInstitution: SetState<Institution | null>;
  detectedChanges: boolean;
  setDetectedChanges: SetState<boolean>;
  users: User[] | null;
  setUsers: SetState<User[] | null>;
  selectedGroup: Group | null;
  setSelectedGroup: (group: Group | null) => void;
  refetchUsers: () => void;
}

export interface DashboardPageProps {
  institutions: Institution[];
  selectedInstitution: Institution | null;
  role: string;
  users: User[];
  token: string;
  profile: User;
}

const DashboardContext = createContext<DashboardContextProps | null>(null);

export const useDashboard = () => useContext(DashboardContext)!;

export function DashboardProvider(props: DashboardPageProps & ChildrenProps) {
  const {
    role,
    token,
    profile,
    users: propsUsers,
    institutions: propsInstitutions,
    selectedInstitution: propsSelectedInstitution,
    children,
  } = props;

  // const [users, setUsers] = useState<User[]>(propsUsers);

  const [institutions, setInstitutions] =
    useState<Institution[]>(propsInstitutions);
  const [selectedInstitution, setSelectedInstitution] =
    useState<Institution | null>(propsSelectedInstitution);
  const [detectedChanges, setDetectedChanges] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(
    selectedInstitution?.groups && selectedInstitution?.groups.length
      ? selectedInstitution.groups[0]
      : null
  );

  const {
    data: users,
    refetch,
    setData: setUsers,
  } = useFetch<User[]>(`${BACKEND_API_BASE_URL}/user`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const value: DashboardContextProps = {
    role,
    token,
    profile,
    refetchUsers: refetch,
    users,
    setUsers,
    institutions,
    setInstitutions,
    selectedInstitution,
    setSelectedInstitution,
    detectedChanges,
    setDetectedChanges,
    selectedGroup,
    setSelectedGroup,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
