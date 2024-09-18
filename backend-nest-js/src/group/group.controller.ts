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
import { AddTrainingComponentsDto } from '../training/dto/add-training-component.dto';
import { AddTrainingExercisesDto } from '../training/dto/add-training-exercise.dto';
import { UpdateTrainingExerciseDto } from '../training/dto/update-training-exercise.dto';
import { CycleService } from './service/cycle.service';
import { SubgroupService } from './service/subgroup.service';
import { TrainingService } from '../training/service/training.service';
import { AddTrainingSupersetDto } from '../training/dto/add-training-superset.dto';

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
    if (this.firebaseService.isAthlete(user))
      return await this.groupService.findAllByMember(user.uid);

    return await this.groupService.findAllByOwner(user.uid);
  }

  @Post()
  @Auth([UserRole.TRAINER, UserRole.MANAGER, UserRole.ADMIN])
  async createGroup(@RequestUser() user: User, @Body() data: CreateGroupDto) {
    const ref = { uid: user.uid };
    return await this.groupService.create(ref, data);
  }

  @Get(':groupId')
  @Auth()
  async findGroup(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
  ) {
    const ref = { uid: user.uid, groupId };
    return await this.groupService.findOneOrFail(ref, {
      authorize: true,
      populate: ['members', 'availableMembersIds', 'subgroups', 'cycles'],
    });
  }

  @Get(':groupId/available-members')
  @Auth()
  async findAvailableMembers(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
  ) {
    const ref = { uid: user.uid, groupId };
    return await this.groupService.findAvailableMembers(ref);
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
    if (this.firebaseService.isAthlete(user))
      return await this.cycleService.findAllByMember(user.uid);

    const ref = { uid: user.uid, groupId };
    return await this.cycleService.findAll(ref);
  }

  @Post(':groupId/cycle')
  @Auth()
  async addCycle(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Body() data: AddCycleDto,
  ) {
    const ref = { uid: user.uid, groupId };
    return await this.groupService.addCycle(ref, data);
  }

  @Get(':groupId/cycle/active')
  @Auth()
  async findActiveCycle(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
  ) {
    return await this.cycleService.findActiveCycle(user.uid);
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

  @Post(':groupId/subgroup')
  @Auth()
  async addSubgroup(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Body() data: AddSubgroupDto,
  ) {
    const ref = { uid: user.uid, groupId, subgroupId: null };
    return await this.groupService.addSubgroup(ref, data);
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
  async findTrainings(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
    @Query() filter: FilterTrainingQueryDto,
  ) {
    if (this.firebaseService.isAthlete(user)) {
      // find group without provided ownerId
      const group = await this.groupService.findOneOrFail({ groupId });
      const ref = {
        uid: group.ownerId,
        groupId,
        cycleId,
      };

      return await this.trainingService.findAllByMember(ref, user.uid, {
        filter: {
          ...(filter.from && { from: { value: filter.from, op: '>=' } }),
          ...(filter.to && { to: { value: filter.to, op: '<=' } }),
        },
        populate: [
          'components',
          'components.supersets',
          'components.supersets.exercises',
          'components.supersets.exercises.exercise',
        ],
      });
    }

    // return await this.trainingService.findAllByMember(user.uid);

    const ref = {
      uid: user.uid,
      groupId,
      cycleId,
      subgroupId: filter.subgroupId || null,
    };

    return await this.trainingService.findAll(ref, {
      filter: {
        subgroupId: { value: filter.subgroupId || null, op: '==' },
        ...(filter.from && { from: { value: filter.from, op: '>=' } }),
        ...(filter.to && { to: { value: filter.to, op: '<=' } }),
      },
      populate: [
        'components',
        'components.supersets',
        'components.supersets.exercises',
        'components.supersets.exercises.exercise',
      ],
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

    return await this.trainingService.create(ref, data);
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

  @Post(':groupId/cycle/:cycleId/training/:trainingId/component')
  @Auth()
  async addComponents(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
    @Param('trainingId') trainingId: string,
    @Body() data: AddTrainingComponentsDto,
  ) {
    const ref = {
      uid: user.uid,
      groupId,
      cycleId,
      trainingId,
      subgroupId: null,
    };

    return await this.trainingService.addComponents(ref, data.components);
  }

  @Patch(':groupId/cycle/:cycleId/training/:trainingId/component/:componentId')
  @Auth()
  async updateComponent(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
    @Body() data: any,
  ) {
    return {};
  }

  @Post(
    ':groupId/cycle/:cycleId/training/:trainingId/component/:componentId/superset',
  )
  @Auth()
  async addSuperset(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
    @Body() input: AddTrainingSupersetDto,
  ) {
    const ref = {
      uid: user.uid,
      groupId,
      cycleId,
      trainingId,
      componentId,
      subgroupId: null,
    };

    return await this.trainingService.addSuperset(ref, input);
  }

  @Post(
    ':groupId/cycle/:cycleId/training/:trainingId/component/:componentId/superset/:supersetId/exercise',
  )
  @Auth()
  async addExercises(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
    @Param('supersetId') supersetId: string,
    @Body() input: AddTrainingExercisesDto,
  ) {
    const ref = {
      uid: user.uid,
      groupId,
      cycleId,
      trainingId,
      componentId,
      supersetId,
      subgroupId: null,
    };

    return await this.trainingService.addExercises(ref, input.exercises);
  }

  @Patch(
    ':groupId/cycle/:cycleId/training/:trainingId/component/:componentId/superset/:supersetId/exercise/:exerciseId',
  )
  @Auth()
  async updateExercise(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
    @Param('supersetId') supersetId: string,
    @Param('exerciseId') exerciseId: string,
    @Body() data: UpdateTrainingExerciseDto,
  ) {
    const ref = {
      uid: user.uid,
      groupId,
      cycleId,
      trainingId,
      componentId,
      supersetId,
      exerciseId,
      subgroupId: null,
    };

    return await this.trainingService.updateExercise(ref, data);
  }
}
