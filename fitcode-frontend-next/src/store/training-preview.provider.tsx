'use client';

import { TrainingComponent } from '@/core/training/type/training-component.type';
import { SetState } from '@/lib/common/type/state.type';
import React, { createContext, useContext, useState } from 'react';

interface ITrainingPreviewContext {
  selectedComponent: TrainingComponent | null;
  setSelectedComponent: SetState<TrainingComponent | null>;
}

const TrainingPreviewContext = createContext<
  ITrainingPreviewContext | undefined
>(undefined);

export const TrainingPreviewProvider = (props: React.PropsWithChildren) => {
  const [selectedComponent, setSelectedComponent] =
    useState<TrainingComponent | null>(null);

  return (
    <TrainingPreviewContext.Provider
      value={{ selectedComponent, setSelectedComponent }}
    >
      {props.children}
    </TrainingPreviewContext.Provider>
  );
};

export const useTrainingPreview = () => useContext(TrainingPreviewContext)!;
