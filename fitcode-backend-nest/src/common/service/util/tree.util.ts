interface TreeOptions<T> {
  idPropertyName: keyof T;
  parentIdPropertyName: keyof T;
  childrenPropertyName: keyof T;
  rootId?: string | null;
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

      if (parentId === rootId) roots.push(map.get(itemId));
      else {
        const parent = map.get(parentId);
        if (parent) parent[childrenPropertyName].push(map.get(itemId));
      }
    }

    return roots;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  forEach<T extends TreeItem = any, Result = any>(
    items: T[],
    childrenPropertyName: keyof T,
    callback: (
      item: T,
      parent: T,
      previousResult: Result,
    ) => Result | Promise<Result>,
    parent: T = undefined,
    result: Result = undefined,
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
            result,
          ),
        ).catch((e) => console.error(e));
      else
        this.forEach(
          item[childrenPropertyName],
          childrenPropertyName,
          callback,
          item,
          cb,
        );
    }
  }

  isLeaf<T extends TreeItem>(item: T, childrenPropertyName: keyof T): boolean {
    return item[childrenPropertyName].length === 0;
  }
}
