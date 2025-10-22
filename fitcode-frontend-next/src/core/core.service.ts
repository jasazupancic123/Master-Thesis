import { AttributeUtil } from './attribute/attribute.util';
import { ComponentUtil } from './component/component.util';
import { ExerciseUtil } from './exercise/utils/exercise.util';
import { GroupUtil } from './group/group.util';
import { InstitutionUtil } from './institution/institution.util';
import { TrainingUtil } from './training/utils/training.util';

class CoreService {
  readonly attribute: AttributeUtil;
  readonly component: ComponentUtil;
  readonly exercise: ExerciseUtil;
  readonly institution: InstitutionUtil;
  readonly group: GroupUtil;
  readonly training: TrainingUtil;

  constructor() {
    this.attribute = new AttributeUtil();
    this.component = new ComponentUtil();
    this.exercise = new ExerciseUtil();
    this.institution = new InstitutionUtil();
    this.group = new GroupUtil();
    this.training = new TrainingUtil();
  }
}

export const core = new CoreService();
