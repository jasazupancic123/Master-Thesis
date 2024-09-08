export interface Component {
  id: string;
  name: string;
  parentId?: string;
  children?: Component[];
}

export type ComponentWithParents = Component & {parents: Component[]};

export type CreateComponent = Pick<Component, 'name' | 'parentId'>;