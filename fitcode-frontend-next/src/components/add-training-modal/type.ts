import {
  Component,
  TreeComponent,
} from '@/controller/component/type/component.type';

export interface AddTrainingModalProps {
  startTime: string;
  endTime: string;
  setStartTime: (startTime: string) => void;
  setEndTime: (endTime: string) => void;
  components: TreeComponent[] | Component[];
  selectedComponents: Component[];
  setSelectedComponents: (components: Component[]) => void;
}
