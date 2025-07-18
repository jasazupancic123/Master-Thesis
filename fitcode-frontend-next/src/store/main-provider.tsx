'use client';

import { ChildrenProps } from '@/common/type/props.type';
import { SetState } from '@/common/type/state.type';
import { Attribute } from '@/controller/attribute/type/attribute.type';
import { Component } from '@/controller/component/type/component.type';
import { ExerciseService } from '@/controller/exercise/exercise.service';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { Method } from '@/controller/method/type/method.type';
import { User } from '@/controller/user/type/user.type';
import { createContext, useContext, useState } from 'react';

export interface MainProviderProps {
  profile: User;
  users: User[];
  components: Component[];
  exercises: Exercise[];
  attributes: Attribute[];
  methods: Method[];
}

interface MainContextProps extends MainProviderProps {
  setProfile: SetState<User>;
  setUsers: SetState<User[]>;
  setComponents: SetState<Component[]>;
  setExercises: SetState<Exercise[]>;
  setAttributes: SetState<Attribute[]>;
  setMethods: SetState<Method[]>;
}

const MainContext = createContext<MainContextProps | null>(null);

export const useMain = () => useContext(MainContext)!;

export function MainProvider(props: MainProviderProps & ChildrenProps) {
  const {
    children,
    profile: initialProfile,
    users: initialUsers,
    components: initialComponents,
    exercises: initialExercises,
    attributes: initialAttributes,
    methods: initialMethods,
  } = props;

  const [profile, setProfile] = useState<User>(initialProfile);
  const [users, setUsers] = useState<User[]>(initialUsers || []);
  const [components, setComponents] = useState<Component[]>(
    initialComponents || []
  );
  const [exercises, setExercises] = useState<Exercise[]>(
    initialExercises.map((e) => ExerciseService.mapComponents(e, components)) ||
      []
  );

  const [attributes, setAttributes] = useState<Attribute[]>(
    initialAttributes || []
  );
  const [methods, setMethods] = useState<Method[]>(initialMethods || []);

  const value: MainContextProps = {
    profile,
    setProfile,
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
  };

  return <MainContext.Provider value={value}>{children}</MainContext.Provider>;
}
