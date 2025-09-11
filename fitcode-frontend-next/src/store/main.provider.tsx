'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import { useAuthenticatedAuth } from './auth.provider';
import type { ChildrenProps } from '@/common/type/props.type';
import type { SetState, SetStateNullable } from '@/common/type/state.type';
import { AppController } from '@/controller/app.controller';
import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type { Component } from '@/controller/component/type/component.type';
import type { Exercise } from '@/controller/exercise/type/exercise.type';
import type { Institution } from '@/controller/institution/type/institution.type';
import type { Method } from '@/controller/method/type/method.type';
import type { User, UserEntity } from '@/controller/user/type/user.type';

export interface MainProviderProps {
  profile: UserEntity;
  users: User[];
  components: Component[];
  exercises: Exercise[];
  attributes: Attribute[];
  methods: Method[];
  institutions: Institution[];
}

interface MainContextProps extends MainProviderProps {
  setProfile: SetStateNullable<UserEntity>;
  setUsers: SetState<User[]>;
  setComponents: SetState<Component[]>;
  setExercises: SetState<Exercise[]>;
  setAttributes: SetState<Attribute[]>;
  setMethods: SetState<Method[]>;
}

const MainContext = createContext<MainContextProps | null>(null);

export const useMain = () => useContext(MainContext)!;

export default function MainProvider(props: ChildrenProps) {
  const { children } = props;
  const { token } = useAuthenticatedAuth();
  const [loading, setLoading] = useState(false);
  const controller = AppController.getInstance(token);

  const [profile, setProfile] = useState<UserEntity | undefined>();
  const [users, setUsers] = useState<User[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]); // initialExercises.map((e) => ExerciseService.mapComponents(e, components)) ||
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [methods, setMethods] = useState<Method[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);

  useEffect(() => {
    async function init() {
      setLoading(true);

      try {
        const data = await controller.init();
        setProfile(data.profile);
        setUsers(data.users);
        setExercises(data.exercises);
        setAttributes(data.attributes);
        setComponents(data.components);
        setMethods(data.methods);
        setInstitutions(data.institutions);
      } catch (e) {
        console.error('Error during main initialization:', e);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [token]);

  if (loading) return <div>Fetching data...</div>;

  const value: MainContextProps = {
    profile: profile!,
    setProfile: setProfile as SetStateNullable<UserEntity>,
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
