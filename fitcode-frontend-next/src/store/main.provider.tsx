'use client';

import { createContext, useContext, useState } from 'react';

import { withAuth } from './auth.provider';
import type { ChildrenProps } from '@/common/type/props.type';
import type { SetState, SetStateNullable } from '@/common/type/state.type';
import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type { Component } from '@/controller/component/type/component.type';
import type { Exercise } from '@/controller/exercise/type/exercise.type';
import type { Group } from '@/controller/group/type/group.type';
import type { Institution } from '@/controller/institution/type/institution.type';
import type { Method } from '@/controller/method/type/method.type';
import { UserRole } from '@/controller/profile/enum/user-role.enum';
import type { Profile } from '@/controller/profile/type/user.type';
import type { AuthUser } from '@/controller/auth/type/user.type';

export interface MainProviderProps {
  profile: Profile;
  users: AuthUser[];
  components: Component[];
  exercises: Exercise[];
  attributes: Attribute[];
  methods: Method[];
  institutions: Institution[];
  groups: Group[];
}

interface MainContextProps extends MainProviderProps {
  setProfile: SetStateNullable<Profile>;
  setUsers: SetState<AuthUser[]>;
  setComponents: SetState<Component[]>;
  setExercises: SetState<Exercise[]>;
  setAttributes: SetState<Attribute[]>;
  setMethods: SetState<Method[]>;
}

const MainContext = createContext<MainContextProps | null>(null);

export const useMain = () => useContext(MainContext)!;

export const AthleteMainProvider = withAuth(MainProvider, [UserRole.ATHLETE]);
export const CoachMainProvider = withAuth(MainProvider, [
  UserRole.TRAINER,
  UserRole.MANAGER,
  UserRole.ADMIN,
]);

export default function MainProvider(props: ChildrenProps & MainProviderProps) {
  const { children } = props;

  const [profile, setProfile] = useState<Profile | undefined>(props.profile);
  const [users, setUsers] = useState<AuthUser[]>(props.users);
  const [exercises, setExercises] = useState<Exercise[]>(props.exercises);
  const [attributes, setAttributes] = useState<Attribute[]>(props.attributes);
  const [components, setComponents] = useState<Component[]>(props.components);
  const [methods, setMethods] = useState<Method[]>(props.methods);

  const value: MainContextProps = {
    profile: profile!,
    setProfile: setProfile as SetStateNullable<Profile>,
    users,
    setUsers,
    components,
    setComponents,
    exercises,
    setExercises,
    attributes,
    setAttributes,
    methods,
    setMethods,
    institutions: props.institutions,
    groups: props.groups,
  };

  return <MainContext.Provider value={value}>{children}</MainContext.Provider>;
}
