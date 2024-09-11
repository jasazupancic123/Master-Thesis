'use client';

import React, { createContext, useContext } from 'react';
import type { Component } from '@/component/entity/component.entity';
import type { ExerciseAttribute } from '@/exercise/entity/exercise-attribute.entity';
import { useFetch } from '@/hook/use-fetch';
import { useLocalStorage } from 'usehooks-ts';
import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { ComponentController } from '@/component/component.controller';
import { ExerciseController } from '@/exercise/exercise.controller';
import { CommonService } from '@/common/service/common.service';
import { AppContextType } from '@/common/type/context.type';
import { theme } from '@/app/style';
import { ThemeProvider } from '@mui/material';

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
  const components = useFetch<Component[]>(ComponentController.URL.components(), { authorization: false });
  const attributes = useFetch<ExerciseAttribute[]>(ExerciseController.URL.attributes(), { authorization: false });

  if (components.error || attributes.error)
    return <div>Error</div>;

  if (components.loading || attributes.loading)
    return <div>Loading...</div>;

  if (!components || !attributes)
    return <div>Missing data</div>;

  return <AppContext.Provider value={{
    token,
    attributes: attributes.data!,
    components: {
      flat: components.data!,
      leafs: components.data!.filter(c => !c.children.length),
      tree: CommonService.instance.tree.fromArray(components.data!, {
        idPropertyName: 'id',
        parentIdPropertyName: 'parent',
        childrenPropertyName: 'children',
      }),
    },
  }}>
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  </AppContext.Provider>;
}

export function useAppContext() {
  return useContext(AppContext);
}