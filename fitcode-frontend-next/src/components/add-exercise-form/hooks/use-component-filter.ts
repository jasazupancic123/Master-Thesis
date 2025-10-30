import { useEffect, useState } from 'react';

import type {
  Component,
  TreeComponent,
} from '@/core/component/type/component.type';
import { lib } from '@/lib';
import { useMain } from '@/store/main.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';

export default function useComponentFilter() {
  const { components } = useMain();
  const { component } = useTrainerDayView();

  const [selectedComponent, setSelectedComponent] = useState<Component | null>(
    component?.component ? component.component : null
  );

  const [filterComponents, setFilterComponents] = useState<TreeComponent[]>([]);
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

    const children = lib.common.tree.fromArray(components, {
      rootId: componentId,
      idPropertyName: 'id',
      parentIdPropertyName: 'parentId',
      childrenPropertyName: 'children',
    });

    const selectedChildren = children.filter((c) =>
      selectedComponentsIds.includes(c.id)
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
          .map((c) => c.id)
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

    const componentTree = lib.common.tree.fromArray(components, {
      rootId: selectedComponent.id,
      idPropertyName: 'id',
      parentIdPropertyName: 'parentId',
      childrenPropertyName: 'children',
    }) as unknown as TreeComponent[];

    setFilterComponents(componentTree);
    setSelectedRootComponentId(null);
    setSelectedComponentsIds([]);
  }, [component, selectedComponent]);

  useEffect(() => {
    if (!selectedRootComponentId) return;

    const componentTree = lib.common.tree.fromArray(components, {
      rootId: selectedRootComponentId,
      idPropertyName: 'id',
      parentIdPropertyName: 'parentId',
      childrenPropertyName: 'children',
    });

    setLeafComponents(componentTree);
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
