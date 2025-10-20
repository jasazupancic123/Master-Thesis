import type { Attribute } from './type/attribute.type';

export class AttributeUtil {
  flatten(
    attribute: Attribute,
    parentPath = '',
    depth = 0,
    isRoot = false
  ): { value: string; label: string; depth: number; isLeaf: boolean }[] {
    const field = attribute.field as string;
    const currentPath = isRoot
      ? parentPath // skip root id
      : parentPath
        ? `${parentPath}:${field}`
        : field;

    if (!attribute.options || attribute.options.length === 0)
      // Leaf node
      return [
        {
          value: currentPath,
          label: attribute.name,
          depth,
          isLeaf: true,
        },
      ];

    return [
      {
        value: currentPath,
        label: attribute.name,
        depth,
        isLeaf: false,
      },
      ...attribute.options.flatMap((opt) =>
        this.flatten(opt, currentPath, depth + 1)
      ),
    ];
  }

  leaf(root: Attribute, path: string): Attribute | undefined {
    const segments = path.split(':');
    let current: Attribute | undefined = root;

    for (let i = 0; i < segments.length; i++) {
      if (!current?.options) return undefined;

      current = current.options.find((opt) => opt.field === segments[i]);
      if (!current) return undefined;
    }

    return current;
  }
}
