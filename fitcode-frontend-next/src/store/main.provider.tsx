'use client';

import { createContext, useContext, useState } from 'react';

import { withAuth } from './auth.provider';
import type { AuthUser } from '@/core/auth/type/user.type';
import type { Component } from '@/core/component/type/component.type';
import type { Exercise } from '@/core/exercise/type/exercise.type';
import type { Group } from '@/core/group/type/group.type';
import type { Institution } from '@/core/institution/type/institution.type';
import type { Method } from '@/core/method/type/method.type';
import { UserRole } from '@/core/profile/enum/user-role.enum';
import type { Profile } from '@/core/profile/type/user.type';
import type { SetState, SetStateNullable } from '@/lib/common/type/state.type';

export interface MainProviderProps extends React.PropsWithChildren {
  profile: Profile;
  users: AuthUser[];
  components: Component[];
  exercises: Exercise[];
  methods: Method[];
  institutions: Institution[];
  groups: Group[];
}

interface IMainContext extends MainProviderProps {
  setProfile: SetStateNullable<Profile>;
  setUsers: SetState<AuthUser[]>;
  setComponents: SetState<Component[]>;
  setExercises: SetState<Exercise[]>;
  setMethods: SetState<Method[]>;
  setGroups: SetState<Group[]>;
}

const MainContext = createContext<IMainContext | null>(null);

export const useMain = () => useContext(MainContext)!;

export const AthleteMainProvider = withAuth(MainProvider, [UserRole.ATHLETE]);
export const CoachMainProvider = withAuth(MainProvider, [
  UserRole.TRAINER,
  UserRole.MANAGER,
  UserRole.ADMIN,
]);

export default function MainProvider(props: MainProviderProps) {
  const { children } = props;

  const [profile, setProfile] = useState<Profile | undefined>(props.profile);
  const [users, setUsers] = useState<AuthUser[]>(props.users);
  const [exercises, setExercises] = useState<Exercise[]>(props.exercises);
  const [components, setComponents] = useState<Component[]>(props.components);
  const [methods, setMethods] = useState<Method[]>(props.methods);
  const [groups, setGroups] = useState<Group[]>(props.groups);

  const value: IMainContext = {
    profile: profile!,
    setProfile: setProfile as SetStateNullable<Profile>,
    users,
    setUsers,
    components,
    setComponents,
    exercises,
    setExercises,
    methods,
    setMethods,
    institutions: props.institutions,
    groups,
    setGroups,
  };

  return <MainContext.Provider value={value}>{children}</MainContext.Provider>;
}
