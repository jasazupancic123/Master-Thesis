interface TreeOptions<T> {
  idPropertyName: keyof T;
  parentIdPropertyName: keyof T;
  childrenPropertyName: string;
  rootId?: string | null;
}

export class Tree {
  static fromArray<T>(items: T[], options: TreeOptions<T>): T[] {
    const {
      idPropertyName,
      parentIdPropertyName,
      childrenPropertyName,
      rootId = null,
    } = options;

    const map = new Map<any, T & { [key: string]: any }>();
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

  static forEach<T = any, V = any>(items: T[], childrenPropertyName: keyof T, callback: (item: T, parent: T, previousResult: V) => Promise<V>, parent: T = undefined, result: V = undefined) {
    for (const item of items) {
      callback(item, parent, result)
        .then((result) => this.forEach(item[childrenPropertyName], childrenPropertyName, callback, item, result))
        .catch((e) => console.error(e));
    }
  }

  static leafs<T>(items: T[], childrenPropertyName: keyof T): T & { parents: T[] }[] {
    const result: T & { parents: T[] }[] = [];

    this.forEach<T, T & { parents: T[] }>(items, childrenPropertyName, async (item, parent, previousResult) => {
      // get all parents of the current item in the tree
      const parents = parent ? [...previousResult.parents, parent] : [];
      if (this.isLeaf(item, childrenPropertyName))
        result.push({ ...item, parents });

      return { ...item, parents };
    });

    return result;
  }

  static isLeaf<T>(item: T, childrenPropertyName: string): boolean {
    return item[childrenPropertyName].length === 0;
  }
}