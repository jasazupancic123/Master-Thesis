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

  private constructor(token: string) {
    this.auth = AuthController.getInstance(token);
    this.component = ComponentController.getInstance(token);
    this.exercise = ExerciseController.getInstance(token);
    this.group = GroupController.getInstance(token);
    this.institution = InstitutionController.getInstance(token);
    this.method = MethodController.getInstance(token);
    this.training = TrainingController.getInstance(token);
    this.profile = ProfileController.getInstance(token);
    this.app = AppController.getInstance(token);
  }

  public static getInstance(token: string): Controller {
    Controller.instance = new Controller(token);
    return Controller.instance;
  }
}
