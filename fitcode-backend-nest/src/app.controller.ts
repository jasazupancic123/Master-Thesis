import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AppService } from './app.service';
import { AttributeService } from './attribute/service/attribute.service';
import { AuthService } from './auth/auth.service';
import { Auth } from './common/decorator/auth.decorator';
import { RequestUser } from './common/decorator/request-user.decorator';
import { User } from './common/type/firebase-auth.type';
import { measureAsync } from './common/utils/time.util';
import { ComponentService } from './component/component.service';
import { ExerciseService } from './exercise/service/exercise.service';
import { GroupService } from './group/group.service';
import { InstitutionService } from './institution/service/institution.service';
import { MethodService } from './method/service/method.service';
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
    private readonly attributeService: AttributeService,
    private readonly componentService: ComponentService,
    private readonly methodService: MethodService,
    private readonly institutionService: InstitutionService,
    private readonly groupService: GroupService,
  ) {}

  @Get()
  ping(): string {
    return this.appService.getHello();
  }

  @Auth()
  @Get('init')
  async init(@RequestUser() user: User) {
    const [
      usersRes,
      exercisesRes,
      attributesRes,
      componentsRes,
      methodsRes,
      institutionsRes,
      profileRes,
      groupsRes,
    ] = await Promise.all([
      measureAsync(
        'authService.findAll()',
        () => this.authService.findAll(user),
        this.logger,
      ),
      measureAsync(
        'exerciseService.findAllGlobal()',
        () => this.exerciseService.findAllGlobal(),
        this.logger,
      ),
      measureAsync(
        'attributeService.findAll()',
        () => this.attributeService.findAll(),
        this.logger,
      ),
      measureAsync(
        'componentService.findAllFlat()',
        () => this.componentService.findAllFlat(),
        this.logger,
      ),
      measureAsync(
        'methodService.findAll()',
        () => this.methodService.findAll(),
        this.logger,
      ),
      measureAsync(
        'institutionService.findAll()',
        () => this.institutionService.findAll(user),
        this.logger,
      ),
      measureAsync(
        'profileService.findProfile()',
        () => this.profileService.findProfile(user),
        this.logger,
      ),
      measureAsync(
        'groupService.findAll()',
        () => this.groupService.findAll(user),
        this.logger,
      ),
    ]);

    const users = usersRes.result;
    const exercises = exercisesRes.result;
    const attributes = attributesRes.result;
    const components = componentsRes.result;
    const methods = methodsRes.result;
    const institutions = institutionsRes.result;
    const profile = profileRes.result;
    const groups = groupsRes.result;

    const institutionExercises = await Promise.all(
      institutions.map((inst) =>
        this.exerciseService.findAllByInstitution(inst.id),
      ),
    );

    institutionExercises.forEach((list) => exercises.push(...list));

    return {
      profile,
      users,
      exercises,
      attributes,
      components,
      methods,
      institutions,
      groups,
    };
  }
}
