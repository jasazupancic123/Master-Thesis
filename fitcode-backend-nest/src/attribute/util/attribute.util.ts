import type { Attribute } from '@src/attribute/entity/attribute.entity';

export interface ValidationResult {
  isValid: boolean;
  lastValidPath: string;
  nextOptions: string[];
}

export function checkPathWithNextOptions(
  path: string,
  tree: Attribute[],
): ValidationResult {
  const parts = path.split(':');
  let current: Attribute[] = tree;
  let lastValidPath = '';

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const node = current.find((item) => item.field === part);
    if (!node)
      return {
        isValid: false,
        lastValidPath,
        nextOptions: current.map((c) => c.field) as string[],
      };

    lastValidPath = lastValidPath ? `${lastValidPath}:${part}` : part;
    current = node.options ?? [];
  }

  return {
    isValid: true,
    lastValidPath,
    nextOptions: current.map((c) => c.field) as string[],
  };
}
