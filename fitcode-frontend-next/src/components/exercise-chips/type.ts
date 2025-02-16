import { SetState } from '@/common/type/state.type';
import {
  Component,
  TreeComponent,
} from '@/controller/component/type/component.type';
import { SxProps } from '@mui/material';

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
}
