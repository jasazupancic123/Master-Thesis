import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { GroupService } from './group.service';
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

@Controller('group')
export class GroupController {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly groupService: GroupService,
  ) {
  }

  @Get()
  @Auth()
  async findAllGroups(@RequestUser() user: User) {
    if (this.firebaseService.isAthlete(user))
      return await this.groupService.findAthleteGroups(user);
    return await this.groupService.findUserGroups(user);
  }

  @Post()
  @Auth([UserRole.TRAINER, UserRole.MANAGER, UserRole.ADMIN])
  async createGroup(@RequestUser() user: User, @Body() data: CreateGroupDto) {
    return await this.groupService.createGroup(user, data);
  }

  @Get(':groupId')
  @Auth()
  async findGroup(@RequestUser() user: User, @Param('groupId') groupId: string) {
    return await this.groupService.findOneByIdOrFail(user, groupId);
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
  async findAllCycles(@RequestUser() user: User, @Param('groupId') groupId: string) {
    return await this.groupService.findAllCycles(user, { groupId });
  }

  @Post(':groupId/cycle')
  @Auth()
  async addCycle(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Body() data: AddCycleDto,
  ) {
    return await this.groupService.addCycle(user, { ...data, id: groupId });
  }

  @Get(':groupId/cycle/:cycleId')
  @Auth()
  async findCycle(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
  ) {
    if (cycleId === 'active')
      return await this.groupService.findActiveCycle(user, { groupId });

    return await this.groupService.findCycleByIdOrFail(user, { groupId, cycleId });
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
    return await this.groupService.findSubgroups(user, { groupId });
  }

  @Post(':groupId/subgroup')
  @Auth()
  async addSubgroup(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Body() data: AddSubgroupDto,
  ) {
    return await this.groupService.addSubgroup(user, { ...data, id: groupId });
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
    return await this.groupService.trainingService.findTrainings(user, { groupId, cycleId }, { filter });
  }

  @Post(':groupId/cycle/:cycleId/training')
  @Auth()
  async addTraining(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
    @Body() data: CreateTrainingDto,
  ) {
    return await this.groupService.trainingService.createTraining(user, { groupId, cycleId }, data);
  }

  @Get(':groupId/cycle/:cycleId/training/:trainingId')
  @Auth()
  async findTraining(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
    @Param('trainingId') trainingId: string,
  ) {
    return await this.groupService.trainingService.findTrainingById(user, { groupId, cycleId, trainingId });
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
    return await this.groupService.trainingService.addComponent(user, {
      groupId,
      cycleId,
      trainingId,
    }, data);
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
    const ref = { groupId, cycleId, trainingId, componentId };
    await this.groupService.trainingService.findTrainingByIdOrFail(user, ref);
    return await this.groupService.trainingService.findTrainingComponent(user, ref);
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

  @Post(':groupId/cycle/:cycleId/training/:trainingId/component/:componentId/exercise')
  @Auth()
  async addTrainingComponentExercise(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
    @Body() data: AddTrainingExercise,
  ) {
    return await this.groupService.trainingService.addExercise(user, {
      groupId,
      cycleId,
      trainingId,
      componentId,
    }, data);
  }

  @Get(':groupId/cycle/:cycleId/training/:trainingId/component/:componentId/exercise/:exerciseId')
  @Auth()
  async findTrainingComponentExercise(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
    @Param('exerciseId') exerciseId: string,
  ) {
    const ref = { groupId, cycleId, trainingId, componentId, exerciseId };
    await this.groupService.trainingService.findTrainingByIdOrFail(user, ref);
    return await this.groupService.trainingService.findTrainingExercise(ref);
  }

  @Patch(':groupId/cycle/:cycleId/training/:trainingId/component/:componentId/exercise/:exerciseId')
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
    return await this.groupService.trainingService.updateExercise(user, {
      groupId,
      cycleId,
      trainingId,
      componentId,
      exerciseId,
    }, data);
  }
}
