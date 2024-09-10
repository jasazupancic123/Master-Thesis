import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { GroupService } from './service/group.service';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { User } from '../common/type/firebase-auth.type';
import { Auth } from '../common/decorator/auth.decorator';
import { UserRole } from '../user/enum/user-role.enum';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddCycleDto } from './dto/add-cycle.dto';
import { AddSubgroupDto } from './dto/add-subgroup.dto';
import { FirebaseService } from '../firebase/firebase.service';
import { FilterTrainingQueryDto } from '../training/dto/filter-training-query.dto';
import { CreateTrainingDto } from '../training/dto/create-training.dto';
import { AddTrainingComponentDto } from '../training/dto/add-training-component.dto';
import { AddTrainingExercise } from '../training/dto/add-training-exercise.dto';
import { UpdateTrainingExerciseDto } from '../training/dto/update-training-exercise.dto';
import { CycleService } from './service/cycle.service';
import { SubgroupService } from './service/subgroup.service';
import { TrainingService } from '../training/service/training.service';

@Controller('group')
export class GroupController {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly groupService: GroupService,
    private readonly cycleService: CycleService,
    private readonly subgroupService: SubgroupService,
    private readonly trainingService: TrainingService,
  ) {}

  @Get()
  @Auth()
  async findAllGroups(@RequestUser() user: User) {
    const ref = { uid: user.uid };
    if (this.firebaseService.isAthlete(user))
      return await this.groupService.findGroupsByMember(ref);

    return await this.groupService.findGroupsByOwner(ref);
  }

  @Post()
  @Auth([UserRole.TRAINER, UserRole.MANAGER, UserRole.ADMIN])
  async createGroup(@RequestUser() user: User, @Body() data: CreateGroupDto) {
    const ref = { uid: user.uid };
    return await this.groupService.createGroup(user, ref, data);
  }

  @Get(':groupId')
  @Auth()
  async findGroup(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
  ) {
    const ref = { uid: user.uid, groupId };
    return await this.groupService.findUserGroupOrFail(user, ref, {
      populate: ['members', 'subgroups', 'cycles', 'cycles.trainings'],
    });
  }

  @Patch(':groupId')
  @Auth()
  async updateGroup(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Body() data: any,
  ) {
    return {};
  }

  @Get(':groupId/cycle')
  @Auth()
  async findAllCycles(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
  ) {
    const ref = { uid: user.uid, groupId };
    return await this.cycleService.findUserCycles(user, ref);
  }

  @Post(':groupId/cycle')
  @Auth()
  async addCycle(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Body() data: AddCycleDto,
  ) {
    const ref = { uid: user.uid, groupId };
    return await this.groupService.addCycle(user, ref, data);
  }

  @Get(':groupId/cycle/:cycleId')
  @Auth()
  async findCycle(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
  ) {
    const ref = { uid: user.uid, groupId, cycleId, subgroupId: null };

    if (cycleId === 'active')
      return await this.cycleService.findActiveCycle(ref);
    return await this.cycleService.findUserCycleOrFail(user, ref);
  }

  @Patch(':groupId/cycle/:cycleId')
  @Auth()
  async updateCycle(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
  ) {
    return {};
  }

  @Get(':groupId/subgroup')
  @Auth()
  async findAllSubgroups(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
  ) {
    const ref = { uid: user.uid, groupId };
    return await this.subgroupService.findSubgroups(ref);
  }

  @Post(':groupId/subgroup')
  @Auth()
  async addSubgroup(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Body() data: AddSubgroupDto,
  ) {
    const ref = { uid: user.uid, groupId, subgroupId: null };
    return await this.groupService.addSubgroup(user, ref, data);
  }

  @Get(':groupId/subgroup/:subgroupId')
  @Auth()
  async findSubgroup(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('subgroupId') subgroupId: string,
  ) {
    return {};
  }

  @Patch(':groupId/subgroup/:subgroupId')
  @Auth()
  async updateSubgroup(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('subgroupId') subgroupId: string,
    @Body() data: any,
  ) {
    return {};
  }

  @Get(':groupId/cycle/:cycleId/training')
  @Auth()
  async findAllTrainings(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
    @Query() filter: FilterTrainingQueryDto,
  ) {
    const ref = {
      uid: user.uid,
      groupId,
      cycleId,
      subgroupId: filter.subgroupId || null,
    };
    return await this.trainingService.findTrainings(ref, {
      filter: {
        ...(filter.subgroupId && {
          subgroupId: { value: filter.subgroupId, op: '==' },
        }),
        ...(filter.from && { from: { value: filter.from, op: '>=' } }),
        ...(filter.to && { to: { value: filter.to, op: '<=' } }),
      },
    });
  }

  @Post(':groupId/cycle/:cycleId/training')
  @Auth()
  async addTraining(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
    @Body() data: CreateTrainingDto,
  ) {
    const ref = {
      uid: user.uid,
      groupId,
      cycleId,
      subgroupId: data.subgroupId || null,
    };
    return await this.trainingService.createTraining(user, ref, data);
  }

  @Get(':groupId/cycle/:cycleId/training/:trainingId')
  @Auth()
  async findTraining(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
    @Param('trainingId') trainingId: string,
  ) {
    const ref = {
      uid: user.uid,
      groupId,
      cycleId,
      trainingId,
      subgroupId: null,
    };

    return await this.trainingService.findUserTraining(user, ref);
  }

  @Patch(':groupId/cycle/:cycleId/training/:trainingId')
  @Auth()
  async updateTraining(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
    @Param('trainingId') trainingId: string,
    @Body() data: any,
  ) {
    return {};
  }

  @Get(':groupId/cycle/:cycleId/training/:trainingId/component')
  @Auth()
  async findAllTrainingComponents(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
    @Param('trainingId') trainingId: string,
  ) {
    return {};
  }

  @Post(':groupId/cycle/:cycleId/training/:trainingId/component')
  @Auth()
  async addTrainingComponent(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
    @Param('trainingId') trainingId: string,
    @Body() data: AddTrainingComponentDto,
  ) {
    const ref = {
      uid: user.uid,
      groupId,
      cycleId,
      trainingId,
      subgroupId: null,
    };
    return await this.trainingService.addComponent(user, ref, data);
  }

  @Get(':groupId/cycle/:cycleId/training/:trainingId/component/:componentId')
  @Auth()
  async findTrainingComponent(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
  ) {
    const ref = {
      uid: user.uid,
      groupId,
      cycleId,
      trainingId,
      componentId,
      subgroupId: null,
    };

    return await this.trainingService.findUserTrainingComponent(user, ref);
  }

  @Patch(':groupId/cycle/:cycleId/training/:trainingId/component/:componentId')
  @Auth()
  async updateTrainingComponent(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
    @Body() data: any,
  ) {
    return {};
  }

  // NOTE - will be returned in findTrainingComponent response
  /*@Get(':groupId/cycle/:cycleId/training/:trainingId/component/:componentId/exercise')
  @Auth()
  async findAllTrainingComponentExercises(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
  ) {
    return {};
  }*/

  @Post(
    ':groupId/cycle/:cycleId/training/:trainingId/component/:componentId/exercise',
  )
  @Auth()
  async addTrainingComponentExercise(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
    @Body() data: AddTrainingExercise,
  ) {
    const ref = {
      uid: user.uid,
      groupId,
      cycleId,
      trainingId,
      componentId,
      subgroupId: null,
    };

    return await this.trainingService.addExercise(user, ref, data);
  }

  @Get(
    ':groupId/cycle/:cycleId/training/:trainingId/component/:componentId/exercise/:exerciseId',
  )
  @Auth()
  async findTrainingComponentExercise(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
    @Param('exerciseId') exerciseId: string,
  ) {
    const ref = {
      uid: user.uid,
      groupId,
      cycleId,
      trainingId,
      componentId,
      exerciseId,
      subgroupId: null,
    };

    return await this.trainingService.findUserTrainingExercise(user, ref);
  }

  @Patch(
    ':groupId/cycle/:cycleId/training/:trainingId/component/:componentId/exercise/:exerciseId',
  )
  @Auth()
  async updateTrainingComponentExercise(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
    @Param('exerciseId') exerciseId: string,
    @Body() data: UpdateTrainingExerciseDto,
  ) {
    const ref = {
      uid: user.uid,
      groupId,
      cycleId,
      trainingId,
      componentId,
      exerciseId,
      subgroupId: null,
    };

    return await this.trainingService.updateExercise(user, ref, data);
  }
}
