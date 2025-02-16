import { SetState } from '@/common/type/state.type';
import { SxProps } from '@mui/material';
import {
  Component,
  TreeComponent,
} from '@/controller/component/type/component.type';

export interface ExerciseChipsProps {
  components: (Component | TreeComponent)[];
  noSelectionLabel?: string; // for all / no selection
  selected?: null | Component | TreeComponent | (Component | TreeComponent)[];
  setSelected?: SetState<ExerciseChipsProps['selected']>;
  small?: boolean;
  direction?: 'row' | 'column';
  itemSx?: SxProps;
  sx?: SxProps;
  bgColor?: string;
  primaryColor?: string;
  type?: 'single' | 'multiple';
}
