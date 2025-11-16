import { AppController } from './app.controller';
import { AuthController } from './auth/auth.controller';
import { ExerciseController } from './exercise/exercise.controller';
import { ExerciseAiPrescriptionsController } from './exercise-ai-prescriptions/exercise-ai-prescriptions.controller';
import { GroupController } from './group/group.controller';
import { InstitutionController } from './institution/institution.controller';
import { ProfileController } from './profile/profile.controller';
import { TrainingController } from './training/training.controller';

export class Controller {
  private static instance: Controller;

  public auth: AuthController;
  public exercise: ExerciseController;
  public group: GroupController;
  public institution: InstitutionController;
  public training: TrainingController;
  public profile: ProfileController;
  public exerciseAiPrescriptions: ExerciseAiPrescriptionsController;
  public app: AppController;

  private constructor() {
    this.auth = AuthController.getInstance();
    this.exercise = ExerciseController.getInstance();
    this.group = GroupController.getInstance();
    this.institution = InstitutionController.getInstance();
    this.training = TrainingController.getInstance();
    this.profile = ProfileController.getInstance();
    this.exerciseAiPrescriptions =
      ExerciseAiPrescriptionsController.getInstance();
    this.app = AppController.getInstance();
  }

  public static getInstance(): Controller {
    Controller.instance = new Controller();
    return Controller.instance;
  }
}
