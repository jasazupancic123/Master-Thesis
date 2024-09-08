'use client';

import type { Component } from '@/component/type/component.type';
import { ComponentWithParents } from '@/component/type/component.type';
import React, { createContext, useContext } from 'react';
import { useFetch } from '@/hook/use-fetch';
import { useLocalStorage } from 'usehooks-ts';
import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { TreeUtil } from '@/common/service/util/tree.util';
import { ApiUtil } from '@/common/service/util/api.util';
import { ExerciseAttribute } from '@/exercise/type/exercise.type';

export type AppContextType = {
  token: string
  attributes: ExerciseAttribute[],
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
  const [components, loading, error] = useFetch<Component[]>(ApiUtil.URL.components(), { authorization: false });
  const [attributes, loadingAttributes, errorAttributes] = useFetch<ExerciseAttribute[]>(ApiUtil.URL.exerciseAttributes(), { authorization: false });

  if (error || errorAttributes)
    return <div>Error: {error?.message || 'Error'}</div>;

  if (loading || loadingAttributes)
    return <div>Loading...</div>;

  const tree = TreeUtil.fromArray(components, {
    idPropertyName: 'id',
    parentIdPropertyName: 'parentId',
    childrenPropertyName: 'children',
  });

  const leafs = TreeUtil.leafs(tree, 'children') as ComponentWithParents[];

  return <AppContext.Provider value={{
    token,
    attributes,
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