import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AppService } from './app.service';
import { AttributeService } from './attribute/service/attribute.service';
import { Auth } from './common/decorator/auth.decorator';
import { RequestUser } from './common/decorator/request-user.decorator';
import { User } from './common/type/firebase-auth.type';
import { ComponentService } from './component/component.service';
import { ExerciseService } from './exercise/service/exercise.service';
import { GroupService } from './group/group.service';
import { InstitutionService } from './institution/service/institution.service';
import { MethodService } from './method/service/method.service';
import { UserService } from './user/service/user.service';

@ApiTags('General')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly userService: UserService,
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
      this.userService.findAll(user),
      this.exerciseService.findAllGlobal(),
      this.attributeService.findAll(),
      this.componentService.findAllFlat(),
      this.methodService.findAll(),
      this.institutionService.findAll(user),
      this.userService.findProfile(user),
      this.groupService.findAll(user),
    ]);

    institutions.forEach(async (institution) => {
      exercises.push(
        ...(await this.exerciseService.findAllByInstitution(institution.id)),
      );
    });

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
