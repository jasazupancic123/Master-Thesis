import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AppService } from './app.service';
import { AttributeService } from './attribute/service/attribute.service';
import { AuthService } from './auth/auth.service';
import { Auth } from './common/decorator/auth.decorator';
import { RequestUser } from './common/decorator/request-user.decorator';
import { User } from './common/type/firebase-auth.type';
import { ComponentService } from './component/component.service';
import { ExerciseService } from './exercise/service/exercise.service';
import { GroupService } from './group/group.service';
import { InstitutionService } from './institution/service/institution.service';
import { MethodService } from './method/service/method.service';
import { ProfileService } from './profile/service/profile.service';

@ApiTags('General')
@Controller()
export class AppController {
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
      users,
      exercises,
      attributes,
      components,
      methods,
      institutions,
      profile,
      groups,
    ] = await Promise.all([
      this.authService.findAll(user),
      this.exerciseService.findAllGlobal(),
      this.attributeService.findAll(),
      this.componentService.findAllFlat(),
      this.methodService.findAll(),
      this.institutionService.findAll(user),
      this.profileService.findProfile(user),
      this.groupService.findAll(user),
    ]);

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
