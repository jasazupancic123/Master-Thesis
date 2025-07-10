import { ComponentLevel } from '../enum/component-level.enum';

export type SelectedTarget = {
  componentId: string;
  targetId: string;
  componentLevel?: ComponentLevel;
};
