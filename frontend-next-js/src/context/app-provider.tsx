'use client';

import type { Component } from '@/type/component.type';
import { ComponentWithParents } from '@/type/component.type';
import React, { createContext, useContext } from 'react';
import { useFetch } from '@/hook/use-fetch';
import { useLocalStorage } from 'usehooks-ts';
import { FIREBASE_COOKIE_NAME } from '@/constant/cookies';
import { Tree } from '@/util/tree';
import { FitcodeApi } from '@/util/api';
import { ExerciseAttribute } from '@/type/exercise.type';

export type AppContextType = {
  token: string
  attributes: {
    flat: ExerciseAttribute[]
    tree: ExerciseAttribute[]
  },
  components: {
    flat: Component[]
    tree: Component[]
    leafs: ComponentWithParents[]
  }
}

const AppContext = createContext<AppContextType>({
  token: '',
  attributes: {
    flat: [],
    tree: [],
  },
  components: {
    flat: [],
    tree: [],
    leafs: [],
  },
} as AppContextType);

export function AppProvider({ children }) {
  const [token] = useLocalStorage<string>(FIREBASE_COOKIE_NAME, null);
  const [components, loading, error] = useFetch<Component[]>(FitcodeApi.URL.components(), { authorization: false });
  const [attributes, loadingAttributes, errorAttributes] = useFetch<ExerciseAttribute[]>(FitcodeApi.URL.exerciseAttributes(), { authorization: false });

  if (error || errorAttributes)
    return <div>Error: {error?.message || 'Error'}</div>;

  if (loading || loadingAttributes)
    return <div>Loading...</div>;

  const tree = Tree.fromArray(components, {
    idPropertyName: 'id',
    parentIdPropertyName: 'parentId',
    childrenPropertyName: 'children',
  });

  const leafs = Tree.leafs(tree, 'children') as ComponentWithParents[];

  const attributesTree = Tree.fromArray(attributes, {
    idPropertyName: 'id',
    parentIdPropertyName: 'parentId',
    childrenPropertyName: 'subattributes',
  });

  return <AppContext.Provider value={{
    token,
    attributes: {
      flat: attributes,
      tree: attributesTree,
    },
    components: {
      tree,
      leafs,
      flat: components,
    },
  }}>
    {children}
  </AppContext.Provider>;
}

export function useAppContext() {
  return useContext(AppContext);
}