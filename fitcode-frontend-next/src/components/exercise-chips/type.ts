import { SetState } from '@/common/type/state.type';
import {
  Component,
  TreeComponent,
} from '@/controller/component/type/component.type';
import { Target } from '@/controller/target/type/target.type';
import { TrainingComponent } from '@/controller/training/type/training-plan.type';
import { SxProps } from '@mui/material';

export interface ExerciseChipsProps {
  components: (Component | TreeComponent)[];
  noSelectionLabel?: string; // for all / no selection
  selected?:
    | null
    | Component
    | TreeComponent
    | TrainingComponent
    | (Component | TreeComponent | TrainingComponent)[];
  setSelected?: SetState<ExerciseChipsProps['selected']>;
  small?: boolean;
  direction?: 'row' | 'column';
  itemSx?: SxProps;
  sx?: SxProps;
  bgColor?: string;
  primaryColor?: string;
  type?: 'single' | 'multiple';
  cycleView?: boolean; // used in cycle view to show only components with methods
  selectedTargets?: { componentId: string; target: Target }[];
  setSelectedTargets?: SetState<{ componentId: string; target: Target }[]>;
}
