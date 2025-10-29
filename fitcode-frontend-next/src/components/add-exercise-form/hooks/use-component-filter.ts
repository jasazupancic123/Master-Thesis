import { useEffect, useState } from 'react';

import type {
  Component,
  TreeComponent,
} from '@/core/component/type/component.type';
import { useMain } from '@/store/main.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';
import { lib } from '@/lib';

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
  >(null); // which one is clicked, used for leaf menu

  const [anchorElRoot, setAnchorElRoot] = useState<null | HTMLElement>(null);
  const [anchorElLeaf, setAnchorElLeaf] = useState<null | HTMLElement>(null);

  const openLeafMenu = Boolean(anchorElLeaf);

  const handleClickLeaf = (
    event: React.MouseEvent<HTMLElement>,
    componentId: string
  ) => {
    setAnchorElLeaf(event.currentTarget);
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

  const onComponentsMenuItemClick = (
    e: React.MouseEvent<HTMLElement>,
    id: string
  ) => {
    const children = lib.common.tree.fromArray(components, {
      rootId: id,
      idPropertyName: 'id',
      parentIdPropertyName: 'parentId',
      childrenPropertyName: 'children',
    });

    if (selectedRootComponentId !== id) setSelectedRootComponentId(id);
    else if (selectedRootComponentId === id) setSelectedRootComponentId(null);

    if (children.length) {
      if (children.every((c) => selectedComponentsIds.includes(c.id))) {
        setSelectedComponentsIds((prev) =>
          prev.filter(
            (componentId) => !children.some((child) => child.id === componentId)
          )
        );
      } else if (children.every((c) => !selectedComponentsIds.includes(c.id))) {
        const childrenIds = children.map((c) => c.id);
        setSelectedComponentsIds((prev) => [
          ...prev,
          ...childrenIds.filter((childId) => !prev.includes(childId)),
        ]);
      }
    } else {
      if (selectedComponentsIds.includes(id)) {
        setSelectedComponentsIds((prev) =>
          prev.filter((componentId) => componentId !== id)
        );
      } else {
        setSelectedComponentsIds((prev) => [...prev, id]);
      }
    }

    handleClickLeaf(e, id);
  };

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
    onComponentsMenuItemClick,
  };
}
