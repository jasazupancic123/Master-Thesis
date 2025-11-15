'use client';

import { createContext, useContext, useState } from 'react';

import { withAuth } from './auth.provider';
import type { AuthUser } from '@/core/auth/type/user.type';
import type { Exercise } from '@/core/exercise/type/exercise.type';
import type { Group } from '@/core/group/type/group.type';
import type { Institution } from '@/core/institution/type/institution.type';
import { UserRole } from '@/core/profile/enum/user-role.enum';
import type { Profile } from '@/core/profile/type/user.type';
import type { ActiveTraining } from '@/core/training/type/training.type';
import type { SetState, SetStateNullable } from '@/lib/common/type/state.type';

export interface MainProviderProps extends React.PropsWithChildren {
  profile: Profile;
  profiles: Profile[];
  users: AuthUser[];
  exercises: Exercise[];
  institutions: Institution[];
  groups: Group[];
  activeTraining: ActiveTraining | null;
}

export interface IMainContext extends MainProviderProps {
  setProfile: SetStateNullable<Profile>;
  setProfiles: SetState<Profile[]>;
  setUsers: SetState<AuthUser[]>;
  setExercises: SetState<Exercise[]>;
  setGroups: SetState<Group[]>;
  setActiveTraining: SetState<ActiveTraining | null>;
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

  const [profiles, setProfiles] = useState<Profile[]>(props.profiles);
  const [profile, setProfile] = useState<Profile | undefined>(props.profile);
  const [users, setUsers] = useState<AuthUser[]>(props.users);
  const [exercises, setExercises] = useState<Exercise[]>(props.exercises);
  const [groups, setGroups] = useState<Group[]>(props.groups);
  const [activeTraining, setActiveTraining] = useState<ActiveTraining | null>(
    props.activeTraining
  );

  const value: IMainContext = {
    profile: profile!,
    setProfile: setProfile as SetStateNullable<Profile>,
    profiles,
    setProfiles,
    users,
    setUsers,
    exercises,
    setExercises,
    institutions: props.institutions,
    groups,
    setGroups,
    activeTraining,
    setActiveTraining,
  };

  return <MainContext.Provider value={value}>{children}</MainContext.Provider>;
}
