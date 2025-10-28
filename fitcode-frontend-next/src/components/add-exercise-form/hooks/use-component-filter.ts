import { Component } from '@/core/component/type/component.type';
import { useMain } from '@/store/main.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';
import { useEffect, useState } from 'react';

export default function useComponentFilter() {
  const { components } = useMain();
  const { component } = useTrainerDayView();

  const [filterComponents, setFilterComponents] = useState<Component[]>([]);

  const [selectedComponentsIds, setSelectedComponentsIds] = useState<string[]>(
    []
  );

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = (): void => {
    setAnchorEl(null);
  };

  useEffect(() => {
    if (!component) return;

    const rootComponents = components.filter(
      (c) => c.parentId === component.id
    );

    const finalComponents: Component[] = [];
    const componentsToEval = [...rootComponents];

    while (componentsToEval.length) {
      const currentComponent = componentsToEval.shift();

      if (!currentComponent) continue;

      const childComponents = components.filter(
        (c) => c.parentId === currentComponent.id
      );

      if (childComponents.length) {
        componentsToEval.push(...childComponents);
      }

      finalComponents.push(currentComponent);
    }

    setFilterComponents(finalComponents);
  }, [component]);

  return {
    filterComponents,
    selectedComponentsIds,
    setSelectedComponentsIds,
    anchorEl,
    open,
    handleClick,
    handleClose,
  };
}
