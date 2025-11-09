import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AppService } from './app.service';
import { AuthService } from './auth/service/auth.service';
import { Auth } from './common/decorator/auth.decorator';
import { RequestUser } from './common/decorator/request-user.decorator';
import { User } from './common/type/firebase-auth.type';
import { measureAsync } from './common/utils/time.util';
import { ExerciseService } from './exercise/service/exercise.service';
import { GroupService } from './group/group.service';
import { InstitutionService } from './institution/service/institution.service';
import { ProfileService } from './profile/service/profile.service';

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
    this.logger.log('Warming up instance ...');
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
    ]);

    const profile = profileRes.result;
    const users = usersRes.result;
    const exercises = exercisesRes.result;
    const institutions = institutionsRes.result;
    const profiles = profilesRes.result;
    const groups = groupsRes.result;

    const institutionExercises = await Promise.all(
      institutions.map((inst) =>
        this.exerciseService.findAllByInstitution(user, inst.id),
      ),
    );

    institutionExercises.forEach((list) => exercises.push(...list));

    return { profile, profiles, users, exercises, institutions, groups };
  }
}
