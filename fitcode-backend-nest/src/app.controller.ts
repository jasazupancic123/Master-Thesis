import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AppService } from './app.service';
import { Auth } from './common/decorator/auth.decorator';
import { RequestUser } from './common/decorator/request-user.decorator';
import { User } from './common/type/firebase-auth.type';
import { NodeEnv } from './config/environment-validation-schema';
import { ExerciseAiPrescriptionsService } from './exercise-ai-prescriptions/exercise-ai-prescriptions.service';
import { FirebaseService } from './firebase/firebase.service';
import { InstitutionService } from './institution/service/institution.service';
import { ProfileService } from './profile/service/profile.service';
import { ActiveTrainingService } from './training/service/active-training.service';

@ApiTags('General')
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly firebase: FirebaseService,
    private readonly profileService: ProfileService,
    private readonly exerciseAiPrescriptionService: ExerciseAiPrescriptionsService,
    private readonly activeTrainingService: ActiveTrainingService,
    private readonly institutionService: InstitutionService,
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

  @Get('init')
  @Auth()
  async init(@RequestUser() user: User) {
    const isAthlete = this.firebase.isAthlete(user);

    const [profile, institutions, exerciseAiPrescriptions, activeTraining] =
      await Promise.all([
        this.profileService.findOneById(user.uid),
        this.institutionService.findAll(user),
        this.exerciseAiPrescriptionService.findAll(),
        isAthlete
          ? this.activeTrainingService.getActiveTrainingByAthlete(
              user,
              user.uid,
            )
          : null,
        isAthlete
          ? this.activeTrainingService.completePastActiveTrainingsForAthlete(
              user.uid,
            )
          : null,
      ]);

    return {
      profile,
      institutions,
      exerciseAiPrescriptions,
      activeTraining,
    };
  }
}
