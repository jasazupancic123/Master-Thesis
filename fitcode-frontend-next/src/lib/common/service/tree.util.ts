interface TreeOptions<T> {
  idPropertyName: keyof T;
  parentIdPropertyName: keyof T;
  childrenPropertyName: keyof T;
  rootId?: string | null;
  getAllChildren?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TreeItem = Record<string, any>;

export class TreeUtil {
  fromArray<T extends TreeItem>(items: T[], options: TreeOptions<T>): T[] {
    const {
      idPropertyName,
      parentIdPropertyName,
      childrenPropertyName,
      rootId = null,
      getAllChildren,
    } = options;

    const map = new Map<unknown, T & TreeItem>();
    const roots: T[] = [];

    // Initialize the map and add the children array to each item
    for (const item of items)
      map.set(item[idPropertyName], { ...item, [childrenPropertyName]: [] });

    // Populate the children arrays and identify the root nodes
    for (const item of items) {
      const itemId = item[idPropertyName];
      const parentId = item[parentIdPropertyName];

      if (parentId === rootId) roots.push(map.get(itemId)!);
      else {
        const parent = map.get(parentId);
        if (parent) parent[childrenPropertyName].push(map.get(itemId));
      }
    }

    // Also returns all children nodes of roots
    if (getAllChildren) {
      const nodesToEval = [...roots];

      while (nodesToEval.length) {
        const currentNode = nodesToEval.shift();
        if (!currentNode) continue;

        const childNodes = currentNode[childrenPropertyName] as T[];
        if (childNodes) nodesToEval.push(...childNodes);
        if (!roots.includes(currentNode)) roots.push(currentNode);
      }
    }

    return roots;
  }

  toArray<T extends TreeItem>(roots: T[], childrenPropertyName: keyof T): T[] {
    const result: T[] = [];
    const nodesToEval = [...roots];

    while (nodesToEval.length) {
      const currentNode = nodesToEval.shift();
      if (!currentNode) continue;

      result.push(currentNode);

      const childNodes = currentNode[childrenPropertyName] as T[];
      if (childNodes) nodesToEval.push(...childNodes);
    }

    return result;
  }

  forEach<T extends TreeItem, Result = unknown>(
    items: T[],
    childrenPropertyName: keyof T,
    callback: (
      item: T,
      parent?: T,
      previousResult?: Result
    ) => Result | Promise<Result>,
    parent?: T,
    result?: Result
  ) {
    for (const item of items) {
      const cb = callback(item, parent, result);

      if (cb instanceof Promise)
        cb.then((result) =>
          this.forEach(
            item[childrenPropertyName],
            childrenPropertyName,
            callback,
            item,
            result
          )
        ).catch((e) => console.error(e));
      else
        this.forEach(
          item[childrenPropertyName],
          childrenPropertyName,
          callback,
          item,
          cb
        );
    }
  }

  getRoot<T extends TreeItem>(item: T, items: T[]): T {
    let current: T = item;
    while (current.parents.length > 0) {
      const parent = items.find((i) => i.id === current.parents[0]);
      if (!parent) break;
      current = parent;
    }

    return current;
  }

  isLeaf<T extends TreeItem>(item: T, childrenPropertyName: keyof T): boolean {
    return (
      !item[childrenPropertyName] || item[childrenPropertyName].length === 0
    );
  }

  /**
   * Returns all leaf ids in the tree
   */
  computeLeafIds<T extends TreeItem>(
    items: T[],
    idPropertyName: keyof T,
    childrenPropertyName: keyof T
  ): string[] {
    const leafes: string[] = [];
    const nodesToEval = [...items];

    while (nodesToEval.length) {
      const currentNode = nodesToEval.shift();
      if (!currentNode) continue;

      const id = currentNode[idPropertyName];
      if (!id) continue;

      if (this.isLeaf(currentNode, childrenPropertyName)) leafes.push(id);
      else {
        const childNodes = currentNode[childrenPropertyName] as T[];
        if (childNodes) nodesToEval.push(...childNodes);
      }
    }

    return leafes;
  }

  /**
   * Returns all leaf nodes in the tree
   */
  computeLeafes<T extends TreeItem>(
    items: T[],
    childrenPropertyName: keyof T
  ): T[] {
    const leafes: T[] = [];
    const nodesToEval = [...items];

    while (nodesToEval.length) {
      const currentNode = nodesToEval.shift();
      if (!currentNode) continue;

      if (this.isLeaf(currentNode, childrenPropertyName))
        leafes.push(currentNode);
      else {
        const childNodes = currentNode[childrenPropertyName] as T[];
        if (childNodes) nodesToEval.push(...childNodes);
      }
    }

    return leafes;
  }

  /**
   * Returns all muscles who have children array
   */
  computeParents<T extends TreeItem>(
    items: T[],
    childrenPropertyName: keyof T
  ): T[] {
    const itemsToEval: T[] = [...items];
    const parents: T[] = [];

    while (itemsToEval.length) {
      const item = itemsToEval.shift();
      if (!item) continue;

      const children = item[childrenPropertyName] as T[];

      if (children && Array.isArray(children) && children.length) {
        parents.push(item);
        itemsToEval.push(...children);
      }
    }

    return parents;
  }
}
