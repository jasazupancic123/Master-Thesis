'use client';

import { createContext, useContext, useState } from 'react';

import type { ChildrenProps } from '@/common/type/props.type';
import type { SetState } from '@/common/type/state.type';
import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type { Component } from '@/controller/component/type/component.type';
import { ExerciseService } from '@/controller/exercise/exercise.service';
import type { Exercise } from '@/controller/exercise/type/exercise.type';
import type { Institution } from '@/controller/institution/type/institution.type';
import type { Method } from '@/controller/method/type/method.type';
import type { User } from '@/controller/user/type/user.type';

export interface MainProviderProps {
  users: User[];
  components: Component[];
  exercises: Exercise[];
  attributes: Attribute[];
  methods: Method[];
  institutions: Institution[];
}

interface MainContextProps extends MainProviderProps {
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
    users: initialUsers,
    components: initialComponents,
    exercises: initialExercises,
    attributes: initialAttributes,
    methods: initialMethods,
    institutions,
  } = props;

  const [components, setComponents] = useState<Component[]>(
    initialComponents || []
  );

  const [exercises, setExercises] = useState<Exercise[]>(
    initialExercises.map((e) => ExerciseService.mapComponents(e, components)) ||
      []
  );

  const [users, setUsers] = useState<User[]>(initialUsers || []);
  const [methods, setMethods] = useState<Method[]>(initialMethods || []);
  const [attributes, setAttributes] = useState<Attribute[]>(
    initialAttributes || []
  );

  const value: MainContextProps = {
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
    institutions,
  };

  return <MainContext.Provider value={value}>{children}</MainContext.Provider>;
}
