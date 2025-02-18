import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Auth } from '../common/decorator/auth.decorator';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { User } from '../common/type/firebase-auth.type';
import { AddTrainingComponentsDto } from './dto/add-training-components.dto';
import { CreateTrainingDto } from './dto/create-training.dto';
import { FilterTrainingQueryDto } from './dto/filter-training-query.dto';
import { UpdateAthleteSetDataDto } from './dto/update-athlete-set-data.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { TrainingService } from './service/training.service';

@Controller('training')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Get()
  @Auth()
  async findAll(
    @RequestUser() user: User,
    @Query() filter: FilterTrainingQueryDto,
  ) {
    return this.trainingService.findAll(user, {
      filter: {
        groupId: { value: filter.groupId },
        cycleId: { value: filter.cycleId },
        ...(filter.from && { from: { value: filter.from, op: '>=' } }),
        ...(filter.to && { to: { value: filter.to, op: '<=' } }),
      },
    });
  }

  @Post()
  @Auth()
  async create(@RequestUser() user: User, @Body() body: CreateTrainingDto) {
    return await this.trainingService.create(user, body);
  }

  @Patch(':trainingId')
  @Auth()
  async update(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Body() body: UpdateTrainingDto,
  ) {
    const ref = { trainingId };
    return await this.trainingService.update(user, ref, body);
  }

  @Patch(
    ':trainingId/component/:componentId/superset/:superset/exercise/:exerciseId/set',
  )
  @Auth()
  async updateAthleteWorkload(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
    @Param('superset', ParseIntPipe) superset: number,
    @Param('exerciseId') exerciseId: string,
    @Body() body: UpdateAthleteSetDataDto,
  ) {
    const ref = {
      trainingId,
      componentId,
      superset,
      exerciseId,
      userId: user.uid,
    };

    await this.trainingService.updateAthleteWorkload(ref, body.sets, user);
    return {};
  }

  @Post(':trainingId/component')
  @Auth()
  async addComponents(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Body() { componentsIds }: AddTrainingComponentsDto,
  ) {
    return await this.trainingService.addComponents(
      user,
      { trainingId },
      componentsIds,
    );
  }

  @Delete(':trainingId/component/:componentId')
  @Auth()
  async deleteComponent(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
  ) {
    const ref = { trainingId, componentId };
    return await this.trainingService.deleteComponent(ref, user);
  }

  /* @Post(':trainingId/subgroup')
  @Auth()
  async addSubgroup(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Body() body: AddSubgroupDto,
  ) {
    const ref = { trainingId };
    return await this.trainingService.addSubgroup(user, ref, body);
  }

  @Patch(':trainingId/subgroup')
  @Auth()
  async updateSubgroups(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Body() { subgroups }: UpdateSubgroupsDto,
  ) {
    const ref = { trainingId };
    return await this.trainingService.updateSubgroups(
      user,
      ref,
      subgroups as Subgroup[],
    );
  }

  @Patch(':trainingId/subgroup/:subgroupId')
  @Auth()
  async updateSubgroup(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('subgroupId') subgroupId: string,
    @Body() body: UpdateSubgroupDto,
  ) {
    const ref = { trainingId, subgroupId };
    return await this.trainingService.updateSubgroup(user, ref, body);
  }

  @Patch(':trainingId/component/:componentId')
  @Auth()
  async updateComponent(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
    @Body() data: UpdateTrainingComponentDto,
  ) {
    const ref = { trainingId, componentId, subgroupId: data.subgroupId };
    return await this.trainingService.updateComponent(user, ref, data);
  }

  @Post(':trainingId/component/:componentId/superset')
  @Auth()
  async addSuperset(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
    @Body() body: AddTrainingSupersetDto,
  ) {
    const ref = { trainingId, componentId, subgroupId: body.subgroupId };
    return await this.trainingService.addSupersets(ref, [body], user);
  }

  @Patch(':trainingId/component/:componentId/superset/:superset')
  @Auth()
  async updateSuperset(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
    @Param('superset', ParseIntPipe) superset: number,
    @Body() body: UpdateTrainingSupersetDto,
  ) {
    const ref = {
      trainingId,
      componentId,
      superset,
      subgroupId: body.subgroupId,
    };

    return await this.trainingService.updateSuperset(ref, body, user);
  }

  @Delete(':trainingId/component/:componentId/superset/:superset')
  @Auth()
  async deleteSuperset(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
    @Param('superset', ParseIntPipe) superset: number,
    @Body() body: SubgroupIdDto,
  ) {
    const ref = {
      trainingId,
      componentId,
      superset,
      subgroupId: body.subgroupId,
    };

    return await this.trainingService.deleteSuperset(ref, user);
  }

  @Post(':trainingId/component/:componentId/superset/:superset/exercise')
  @Auth()
  async addExercises(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
    @Param('superset', ParseIntPipe) superset: number,
    @Body() body: AddTrainingExercisesDto,
  ) {
    const ref = {
      trainingId,
      componentId,
      superset,
      subgroupId: body.subgroupId,
    };

    const data = body.exercises.map((item) => [item.id, item]) as [
      string,
      TrainingExercise,
    ][];

    return await this.trainingService.addExercises(ref, data, user);
  }

  @Patch(
    ':trainingId/component/:componentId/superset/:superset/exercise/:exerciseId',
  )
  @Auth()
  async updateExercise(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
    @Param('superset', ParseIntPipe) superset: number,
    @Param('exerciseId') exerciseId: string,
    @Body() body: UpdateTrainingExerciseDto,
  ) {
    const ref = {
      trainingId,
      componentId,
      superset,
      exerciseId,
      subgroupId: body.subgroupId,
    };

    return await this.trainingService.updateExercise(ref, body, user);
  }

  @Delete(
    ':trainingId/component/:componentId/superset/:superset/exercise/:exerciseId',
  )
  @Auth()
  async deleteExercise(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
    @Param('superset', ParseIntPipe) superset: number,
    @Param('exerciseId') exerciseId: string,
    @Body() body: SubgroupIdDto,
  ) {
    const ref = {
      trainingId,
      componentId,
      superset,
      exerciseId,
      subgroupId: body.subgroupId,
    };

    return this.trainingService.deleteExercise(ref, user);
  } */
}
