import { useEffect, useState } from 'react';

import { Components } from '@/core/exercise/constant/components.constant';
import type { Component } from '@/core/exercise/type/component.type';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';
import { lib } from '@/lib';

export default function useComponentFilter() {
  const { component } = useTrainerDayView();

  const [selectedComponent, setSelectedComponent] = useState<Component | null>(
    Components.find((c) => c.field === component?.id) || null
  );

  const [anchorElLeaf, setAnchorElLeaf] = useState<null | HTMLElement>(null);

  const openLeafMenu = Boolean(anchorElLeaf);

  const [leafComponents, setLeafComponents] = useState<Component[]>([]);

  const [selectedComponentsIds, setSelectedComponentsIds] = useState<string[]>(
    []
  );

  const [selectedRootComponentId, setSelectedRootComponentId] = useState<
    string | null
  >(null); // which subcomponent tree is open

  const computeWholeComponentId = (
    tree: Component[] // goes from [leaf, parent1, parent2, ..., root]
  ): string | null => {
    const wholeComponentId = tree
      .map((c) => c.field)
      .reverse()
      .join(':');

    return wholeComponentId;
  };

  const computeWholeTree = (
    component: Component,
    allComponents: Component[]
  ): Component[] => {
    let parent = allComponents.find((i) =>
      i.options?.some((o) => o === component)
    );

    if (!parent) return [];

    const tree = [component, parent];

    while (parent) {
      const newParent = allComponents.find((i) =>
        i.options?.some((o) => o === parent)
      );

      if (newParent) {
        tree.push(newParent);
      }

      parent = newParent;
    }

    return tree;
  };

  const handleClickLeaf = (
    event: React.MouseEvent<HTMLElement>,
    componentId: string
  ) => {
    const allItems = lib.common.tree.computeAllItemsAsArray(
      Components,
      'options'
    );

    setAnchorElLeaf(event.currentTarget);

    const leafes = lib.common.tree.getLeafesFromRootId(Components, {
      rootId: componentId,
      idPropertyName: 'field',
      childrenPropertyName: 'options',
    });

    setLeafComponents(leafes);

    if (!selectedComponentsIds.includes(componentId)) {
      setSelectedComponentsIds((prev) => [
        ...prev,
        ...leafes
          .map((c) => {
            const tree = computeWholeTree(c, allItems);

            return computeWholeComponentId(tree);
          })
          .filter((v) => v !== null),
      ]);
    }

    setSelectedRootComponentId(componentId);
  };

  const handleCloseLeaf = (): void => {
    setAnchorElLeaf(null);
    setSelectedRootComponentId(null);
  };

  return {
    selectedComponent,
    setSelectedComponent,
    selectedComponentsIds,
    setSelectedComponentsIds,
    selectedRootComponentId,
    setSelectedRootComponentId,
    anchorElLeaf,
    openLeafMenu,
    leafComponents,
    handleCloseLeaf,
    handleClickLeaf,
    computeWholeComponentId,
    computeWholeTree,
  };
}
