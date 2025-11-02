import { AttributeUtil } from './attribute/attribute.util';
import { ExerciseUtil } from './exercise/utils/exercise.util';
import { GroupUtil } from './group/group.util';
import { InstitutionUtil } from './institution/institution.util';
import { ProfileUtil } from './profile/profile.util';
import { TrainingUtil } from './training/utils/training.util';

class CoreService {
  readonly attribute: AttributeUtil;
  readonly exercise: ExerciseUtil;
  readonly institution: InstitutionUtil;
  readonly profile: ProfileUtil;
  readonly group: GroupUtil;
  readonly training: TrainingUtil;

  constructor() {
    this.attribute = new AttributeUtil();
    this.exercise = new ExerciseUtil();
    this.institution = new InstitutionUtil();
    this.profile = new ProfileUtil();
    this.group = new GroupUtil();
    this.training = new TrainingUtil();
    this.profile = new ProfileUtil();
  }
}

export const core = new CoreService();
