import { useEffect, useState } from 'react';

import { Components } from '@/core/exercise/constant/components.constant';
import type { Component } from '@/core/exercise/type/component.type';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';

export default function useComponentFilter() {
  const { component } = useTrainerDayView();
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(
    Components.find((c) => c.field === component?.id) || null
  );

  const [selectedComponentsIds, setSelectedComponentsIds] = useState<string[]>(
    []
  );

  useEffect(() => {
    setSelectedComponentsIds([]);
  }, [selectedComponent]);

  return {
    selectedComponent,
    setSelectedComponent,
    selectedComponentsIds,
    setSelectedComponentsIds,
  };
}
