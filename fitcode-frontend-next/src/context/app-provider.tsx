'use client';

import React, { createContext, useContext } from 'react';
import { useFetch } from '@/hook/use-fetch';
import { useLocalStorage } from 'usehooks-ts';
import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { CommonService } from '@/common/service/common.service';
import { AppContextType } from '@/common/type/context.type';
import { theme } from '@/app/style';
import { ThemeProvider } from '@mui/material';
import {
  Component,
  TreeComponent,
} from '@/controller/component/type/component.type';
import { ExerciseAttribute } from '@/controller/exercise/type/exercise-attribute.type';

interface Props {
  children: React.ReactNode;
}

const AppContext = createContext<AppContextType>({
  token: '',
  attributes: [],
  components: {
    flat: [],
    tree: [],
    leafs: [],
  },
});

export function AppProvider({ children }: Props) {
  const [token] = useLocalStorage<string>(FIREBASE_COOKIE_NAME, '');

  const components = useFetch<Component[]>('/component', { auth: false });
  const attributes = useFetch<ExerciseAttribute[]>('/exercise/attribute', {
    auth: false,
  });

  if (components.loading || attributes.loading) return <div>Loading...</div>;
  if (components.error)
    return <div>Error - could not fetch sport components</div>;
  if (attributes.error)
    return <div>Error - could not fetch exercise attributes</div>;

  return (
    <AppContext.Provider
      value={{
        token,
        attributes: attributes.data!,
        components: {
          flat: components.data!,
          leafs: components.data!.filter((c) => !c.children.length),
          tree: CommonService.instance.tree.fromArray(components.data!, {
            idPropertyName: 'id',
            parentIdPropertyName: 'parent',
            childrenPropertyName: 'children',
          }) as unknown as TreeComponent[],
        },
      }}
    >
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
