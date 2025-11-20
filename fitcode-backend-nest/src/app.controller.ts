import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AppService } from './app.service';
import { AuthService } from './auth/service/auth.service';
import { Auth } from './common/decorator/auth.decorator';
import { RequestUser } from './common/decorator/request-user.decorator';
import { User } from './common/type/firebase-auth.type';
import { measureAsync } from './common/utils/time.util';
import { NodeEnv } from './config/environment-validation-schema';
import { ExerciseService } from './exercise/service/exercise.service';
import { ExerciseAiPrescriptionsService } from './exercise-ai-prescriptions/exercise-ai-prescriptions.service';
import { GroupService } from './group/group.service';
import { InstitutionService } from './institution/service/institution.service';
import { ProfileService } from './profile/service/profile.service';
import { TrainingService } from './training/service/training.service';

@ApiTags('General')
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly authService: AuthService,
    private readonly profileService: ProfileService,
    private readonly exerciseService: ExerciseService,
    private readonly institutionService: InstitutionService,
    private readonly groupService: GroupService,
    private readonly trainingService: TrainingService,
    private readonly exerciseAiPrescriptionsService: ExerciseAiPrescriptionsService,
  ) {}

  @Get()
  ping(): string {
    return this.appService.getHello();
  }

  /**
   * Warmup handler for App Engine to keep instances warm.
   */
  @Get('_ah/warmup')
  warmup(): void {
    const nodeEnv = (process.env.NODE_ENV || 'dev') as NodeEnv;
    this.logger.log(`Warming up instance ... (${nodeEnv})`);
  }

  @Auth()
  @Get('init')
  async init(@RequestUser() user: User) {
    const [
      profileRes,
      usersRes,
      exercisesRes,
      institutionsRes,
      profilesRes,
      groupsRes,
      trainingRes,
      exerciseAiPrescriptionsRes,
    ] = await Promise.all([
      measureAsync(
        'profileService.findOneById()',
        () => this.profileService.findOneById(user.uid),
        this.logger,
      ),
      measureAsync(
        'authService.findAll()',
        () => this.authService.findAll(user),
        this.logger,
      ),
      measureAsync(
        'exerciseService.findAllGlobal()',
        () => this.exerciseService.findAllGlobalCached(user),
        this.logger,
      ),
      measureAsync(
        'institutionService.findAll()',
        () => this.institutionService.findAll(user),
        this.logger,
      ),
      measureAsync(
        'profileService.findAll()',
        () => this.profileService.findAll(user),
        this.logger,
      ),
      measureAsync(
        'groupService.findAll()',
        () => this.groupService.findAll(user),
        this.logger,
      ),
      measureAsync(
        'trainingService.getActiveTraining()',
        () => this.trainingService.getActiveTrainingByAthlete(user, user.uid),
        this.logger,
      ),
      measureAsync(
        'exerciseAiPrescriptionsService.findAll()',
        () => this.exerciseAiPrescriptionsService.findAll(),
        this.logger,
      ),
    ]);

    const profile = profileRes.result;
    const users = usersRes.result;
    const exercises = exercisesRes.result;
    const institutions = institutionsRes.result;
    const profiles = profilesRes.result;
    const groups = groupsRes.result;
    const activeTraining = trainingRes.result;
    const exerciseAiPrescriptions = exerciseAiPrescriptionsRes.result;

    const institutionExercises = await Promise.all(
      institutions.map((inst) =>
        this.exerciseService.findAllByInstitution(user, inst.id),
      ),
    );

    institutionExercises.forEach((list) => exercises.push(...list));

    const protocols = (
      await Promise.all(
        institutions.map(({ id }) =>
          this.institutionService.getProtocols(user, { institutionId: id }),
        ),
      )
    ).flat();

    return {
      profile,
      profiles,
      users,
      exercises,
      institutions,
      groups,
      activeTraining,
      exerciseAiPrescriptions,
      protocols,
    };
  }
}
