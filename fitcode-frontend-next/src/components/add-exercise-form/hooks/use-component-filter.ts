import { useEffect, useState } from 'react';

import { Components } from '@/core/exercise/constant/components.constant';
import type { Component } from '@/core/exercise/type/component.type';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';

export default function useComponentFilter() {
  const { component } = useTrainerDayView();

  const [selectedComponent, setSelectedComponent] = useState<Component | null>(
    Components.find((c) => c.field === component?.id) || null
  );

  const [filterComponents, setFilterComponents] = useState<Component[]>([]);
  const [leafComponents, setLeafComponents] = useState<Component[]>([]);

  const [selectedComponentsIds, setSelectedComponentsIds] = useState<string[]>(
    []
  );
  const [selectedRootComponentId, setSelectedRootComponentId] = useState<
    string | null
  >(null); // which subcomponent tree is open

  const [anchorElRoot, setAnchorElRoot] = useState<null | HTMLElement>(null);
  const [anchorElLeaf, setAnchorElLeaf] = useState<null | HTMLElement>(null);

  const openLeafMenu = Boolean(anchorElLeaf);

  const handleClickLeaf = (
    event: React.MouseEvent<HTMLElement>,
    componentId: string
  ) => {
    setAnchorElLeaf(event.currentTarget);

    const children =
      Components.find((c) => c.field === componentId)?.options || [];

    const selectedChildren = children.filter((c) =>
      selectedComponentsIds.includes(c.field)
    );

    if (children.length === 0) {
      if (selectedComponentsIds.includes(componentId))
        setSelectedComponentsIds((prev) =>
          prev.filter((id) => id !== componentId)
        );
      else setSelectedComponentsIds((prev) => [...prev, componentId]);
    } else if (!selectedChildren.length) {
      setSelectedComponentsIds((prev) => [
        ...prev,
        ...children
          .map((c) => c.field)
          .filter((childId) => !prev.includes(childId)),
      ]);
    }

    setSelectedRootComponentId(componentId);
  };

  const handleCloseLeaf = (): void => {
    setAnchorElLeaf(null);
    setSelectedRootComponentId(null);
  };

  useEffect(() => {
    if (!selectedComponent) return;
    setSelectedRootComponentId(null);
    setSelectedComponentsIds([]);
    setFilterComponents(
      Components.find((c) => c.field === selectedComponent.field)?.options || []
    );
  }, [component, selectedComponent]);

  useEffect(() => {
    if (!selectedRootComponentId) return;
    setLeafComponents(
      Components.find((c) => c.field === selectedRootComponentId)?.options || []
    );
  }, [selectedRootComponentId]);

  return {
    selectedComponent,
    setSelectedComponent,
    filterComponents,
    leafComponents,
    selectedComponentsIds,
    setSelectedComponentsIds,
    selectedRootComponentId,
    anchorElRoot,
    anchorElLeaf,
    openLeafMenu,
    handleClickLeaf,
    handleCloseLeaf,
  };
}
