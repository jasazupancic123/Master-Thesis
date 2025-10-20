import { AppController } from './app.controller';
import { AuthController } from './auth/auth.controller';
import { ComponentController } from './component/component.controller';
import { ExerciseController } from './exercise/exercise.controller';
import { GroupController } from './group/group.controller';
import { InstitutionController } from './institution/institution.controller';
import { MethodController } from './method/method.controller';
import { ProfileController } from './profile/profile.controller';
import { TrainingController } from './training/training.controller';

export class Controller {
  private static instance: Controller;

  public auth: AuthController;
  public component: ComponentController;
  public exercise: ExerciseController;
  public group: GroupController;
  public institution: InstitutionController;
  public method: MethodController;
  public training: TrainingController;
  public profile: ProfileController;
  public app: AppController;

  private constructor() {
    this.auth = AuthController.getInstance();
    this.component = ComponentController.getInstance();
    this.exercise = ExerciseController.getInstance();
    this.group = GroupController.getInstance();
    this.institution = InstitutionController.getInstance();
    this.method = MethodController.getInstance();
    this.training = TrainingController.getInstance();
    this.profile = ProfileController.getInstance();
    this.app = AppController.getInstance();
  }

  public static getInstance(): Controller {
    Controller.instance = new Controller();
    return Controller.instance;
  }
}
