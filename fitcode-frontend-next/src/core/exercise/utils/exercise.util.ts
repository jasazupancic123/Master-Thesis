import { ExerciseAttributeUtil } from './exercise-attribute.util';
import { ExerciseParamUtil } from './exercise-param.util';
import { MuscleUtil } from './muscle.util';

export class ExerciseUtil {
  readonly attribute: ExerciseAttributeUtil;
  readonly param: ExerciseParamUtil;
  readonly muscle: MuscleUtil;

  public constructor() {
    this.attribute = new ExerciseAttributeUtil();
    this.param = new ExerciseParamUtil();
    this.muscle = new MuscleUtil();
  }
}
