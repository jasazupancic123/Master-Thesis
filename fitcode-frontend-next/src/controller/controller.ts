import { AttributeController } from './attribute/attribute.controller';
import { ComponentController } from './component/component.controller';
import { ExerciseController } from './exercise/exercise.controller';
import { GroupController } from './group/group.controller';
import { InstitutionController } from './institution/institution.controller';
import { MethodController } from './method/method.controller';
import { TrainingController } from './training/training.controller';
import { UserController } from './user/user.controller';

export class Controller {
  private static instance: Controller;
  public attribute: AttributeController;
  public component: ComponentController;
  public exercise: ExerciseController;
  public group: GroupController;
  public institution: InstitutionController;
  public method: MethodController;
  public training: TrainingController;
  public user: UserController;

  private constructor(token: string) {
    this.attribute = AttributeController.getInstance(token);
    this.component = ComponentController.getInstance(token);
    this.exercise = ExerciseController.getInstance(token);
    this.group = GroupController.getInstance(token);
    this.institution = InstitutionController.getInstance(token);
    this.method = MethodController.getInstance(token);
    this.training = TrainingController.getInstance(token);
    this.user = UserController.getInstance(token);
  }

  public static getInstance(token: string): Controller {
    if (!Controller.instance) Controller.instance = new Controller(token);
    return Controller.instance;
  }
}
