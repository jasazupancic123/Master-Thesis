interface TreeOptions<T> {
  idPropertyName: keyof T;
  parentIdPropertyName: keyof T;
  childrenPropertyName: keyof T;
  rootId?: string | null;
}

type TreeItem = Record<string, any>

export class Tree {
  static fromArray<T extends TreeItem>(items: T[], options: TreeOptions<T>): T[] {
    const {
      idPropertyName,
      parentIdPropertyName,
      childrenPropertyName,
      rootId = null
    } = options;

    const map = new Map<any, T & TreeItem>();
    const roots: T[] = [];

    // Initialize the map and add the children array to each item
    for (const item of items)
      map.set(item[idPropertyName], { ...item, [childrenPropertyName]: [] });

    // Populate the children arrays and identify the root nodes
    for (const item of items) {
      const itemId = item[idPropertyName];
      const parentId = item[parentIdPropertyName];

      if (parentId === rootId)
        roots.push(map.get(itemId));
      else {
        const parent = map.get(parentId);
        if (parent)
          parent[childrenPropertyName].push(map.get(itemId));
      }
    }

    return roots;
  }

  static forEach<T extends TreeItem = any, Result = any>(
    items: T[],
    childrenPropertyName: keyof T,
    callback: (item: T, parent: T, previousResult: Result) => Result | Promise<Result>,
    parent: T = undefined,
    result: Result = undefined
  ) {
    for (const item of items) {
      const cb = callback(item, parent, result);

      if (cb instanceof Promise)
        cb
          .then((result) => this.forEach(item[childrenPropertyName], childrenPropertyName, callback, item, result))
          .catch((e) => console.error(e));
      else
        this.forEach(item[childrenPropertyName], childrenPropertyName, callback, item, cb);
    }
  }

  static leafs<T extends TreeItem>(
    items: T[],
    childrenPropertyName: keyof T
  ): (T & { parents: T[] })[] {
    const result: (T & { parents: T[] })[] = [];

    this.forEach<T, T & { parents: T[] }>(items, childrenPropertyName, (item, parent, previousResult) => {
      // get all parents of the current item in the tree
      const parents = parent ? [...previousResult.parents, parent] : [];
      if (this.isLeaf(item, childrenPropertyName))
        result.push({ ...item, parents });

      return { ...item, parents };
    });

    return result
  }

  static isLeaf<T extends TreeItem>(item: T, childrenPropertyName: keyof T): boolean {
    return item[childrenPropertyName].length === 0;
  }
}