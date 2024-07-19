'use client'

import type { Component } from '@/type/component.type';
import React, { createContext, useContext } from 'react';
import { useFetch } from '@/hook/use-fetch';
import { useLocalStorage } from 'usehooks-ts';
import { FIREBASE_COOKIE_NAME } from '@/constant/cookies';
import { Tree } from '@/util/tree';
import { ComponentWithParents } from '@/type/component.type';

export type AppContextType = {
  token: string
  components: {
    flat: Component[]
    tree: Component[]
    leafs: ComponentWithParents[]
  }
}

const AppContext = createContext<AppContextType>({
  token: '',
  components: {
    flat: [],
    tree: [],
    leafs: []
  }
} as AppContextType)

export function AppProvider({children}) {
  const [token] = useLocalStorage<string>(FIREBASE_COOKIE_NAME, null)
  const [components, loading, error] = useFetch<Component[]>('/component', {authorization: false})

  if (error)
    return <div>Error: {error.message}</div>

  if (loading)
    return <div>Loading...</div>

  const tree = Tree.fromArray(components, {
    idPropertyName: 'id',
    parentIdPropertyName: 'parentId',
    childrenPropertyName: 'children'
  })

  const leafs = Tree.leafs(tree, 'children') as ComponentWithParents[]

  return <AppContext.Provider value={{token, components: { tree, leafs, flat: components }}}>
    {children}
  </AppContext.Provider>
}

export function useAppContext() {
  return useContext(AppContext)
}