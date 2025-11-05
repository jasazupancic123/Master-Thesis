// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TreeItem = Record<string, any>;

interface TreeOptions<T> {
  idPropertyName: keyof T;
  childrenPropertyName: keyof T;
  rootId: string;
}

export class TreeUtil {
  getLeafesFromRootId<T extends TreeItem>(
    items: T[],
    options: TreeOptions<T>
  ): T[] {
    const { idPropertyName, childrenPropertyName, rootId } = options;

    const allItems = [
      ...this.computeParents(items, childrenPropertyName),
      ...this.computeLeafs(items, childrenPropertyName),
    ];

    const root = allItems.find((item) => item[idPropertyName] === rootId);

    if (!root) return [];

    const leafes = this.computeLeafs([root], childrenPropertyName);

    return leafes;
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

  findNode<T extends TreeItem>(
    selected: string, // for example "category:strength:upper"
    items: T[],
    idPropertyName: keyof T,
    childrenPropertyName: keyof T
  ): T | null {
    const segments = selected.split(':');

    let currentLevel = items;
    let foundNode: T | null = null;

    for (const segment of segments) {
      const found = currentLevel.find(
        (item) => item[idPropertyName] === segment
      );

      if (!found) {
        foundNode = null;
        break;
      }

      foundNode = found;
      currentLevel = found[childrenPropertyName] as T[];
    }

    return foundNode;
  }

  /**
   * For example, if selected is "strength:upper", then all nodes that are options of "strength:upper" will be traversed.
   */
  traverse<T extends TreeItem>(
    selected: string,
    items: T[],
    idPropertyName: keyof T,
    childrenPropertyName: keyof T,
    callback: (node: T, level: number) => void
  ): void {
    const root = this.findNode(
      selected,
      items,
      idPropertyName,
      childrenPropertyName
    );

    if (!root) return;

    const traverseNode = (node: T, level: number) => {
      callback(node, level);
      const children = node[childrenPropertyName] as T[];
      if (children)
        for (const child of children) traverseNode(child, level + 1);
    };

    traverseNode(root, 0);
  }

  getNestedPaths<T extends TreeItem>(
    selected: string,
    items: T[],
    idPropertyName: keyof T = 'id',
    childrenPropertyName: keyof T = 'children'
  ): string[] {
    const collectPaths = (node: T, prefix: string): string[] => {
      const id = node[idPropertyName] as string;
      const currentPath = prefix ? `${prefix}:${id}` : id;
      const children = node[childrenPropertyName] as T[];
      if (!children?.length) return [currentPath];

      return [
        currentPath,
        ...children.flatMap((child) => collectPaths(child, currentPath)),
      ];
    };

    const root = this.findNode(
      selected,
      items,
      idPropertyName,
      childrenPropertyName
    );

    if (!root) return [];
    return collectPaths(root, '');
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

  computeAllItemsAsArray<T extends TreeItem>(
    items: T[],
    childrenPropertyName: keyof T
  ): T[] {
    const result: T[] = [];

    const leafes = this.computeLeafs(items, childrenPropertyName);
    result.push(...leafes);

    const parents = this.computeParents(items, childrenPropertyName);
    result.push(...parents);

    return result;
  }

  /**
   * Returns all leaf nodes in the tree
   */
  computeLeafs<T extends TreeItem>(
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
