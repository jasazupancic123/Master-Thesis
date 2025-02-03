import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { TrainingService } from './service/training.service';
import { Auth } from '../common/decorator/auth.decorator';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { User } from '../common/type/firebase-auth.type';
import { FilterTrainingQueryDto } from './dto/filter-training-query.dto';
import { CreateTrainingDto } from './dto/create-training.dto';
import { AddTrainingComponentsDto } from './dto/add-training-component.dto';
import { AddTrainingSupersetDto } from './dto/add-training-superset.dto';
import { AddTrainingExercisesDto } from './dto/add-training-exercise.dto';
import { UpdateTrainingExerciseDto } from './dto/update-training-exercise.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { UpdateTrainingComponentDto } from './dto/update-training-component.dto';
import { UpdateTrainingSupersetDto } from './dto/update-training-superset.dto';
import { IdsDto } from '../common/dto/id.dto';
import { FirebaseService } from '../firebase/firebase.service';
import { Populate } from '../common/type/orm.type';
import { Training } from './entity/training.entity';
import { TrainingWorkloadService } from './service/training-workload.service';
import { UpdateAthleteSetDataDto } from './dto/update-athlete-set-data.dto';
import { CreateTrainingExercise } from './type/training-exercise.type';
import { TrainingExercise } from './entity/training-exercise.entity';

@Controller('training')
export class TrainingController {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly trainingService: TrainingService,
    private readonly trainingWorkloadService: TrainingWorkloadService,
  ) {}

  @Get()
  @Auth()
  async findTrainings(
    @RequestUser() user: User,
    @Query() filter: FilterTrainingQueryDto,
  ) {
    const isAthlete = this.firebaseService.isAthlete(user);
    const populate = (
      isAthlete
        ? [
            'components',
            'components.supersets',
            'components.supersets.exercises',
            'components.supersets.exercises.exercise',
          ]
        : ['components']
    ) as Populate<Training>[];

    const trainings = await this.trainingService.findAll({
      user,
      filter: {
        groupId: { value: filter.groupId },
        cycleId: { value: filter.cycleId },
        subgroupId: { value: filter.subgroupId || null },
        ...(filter.from && { from: { value: filter.from, op: '>=' } }),
        ...(filter.to && { to: { value: filter.to, op: '<=' } }),
      },
      populate,
    });

    return trainings.map(this.trainingService.map);
  }

  @Post('ids')
  @Auth()
  async populateTrainings(@RequestUser() user: User, @Body() { ids }: IdsDto) {
    const trainings = await this.trainingService.findAll({
      user,
      filter: { ids },
      populate: [
        'components',
        'components.supersets',
        'components.supersets.exercises',
        'components.supersets.exercises.exercise',
      ],
    });

    return trainings.map(this.trainingService.map);
  }

  @Post()
  @Auth()
  async createTraining(
    @RequestUser() user: User,
    @Body() body: CreateTrainingDto,
  ) {
    const { groupId } = body;
    const training = await this.trainingService.create(
      { groupId, ownerId: user.uid, ...body },
      { user },
    );

    return this.trainingService.map(training);
  }

  @Patch(':trainingId')
  @Auth()
  async updateTraining(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Body() body: UpdateTrainingDto,
  ) {
    const ref = { trainingId };
    return await this.trainingService.update(ref, body, { user });
  }

  @Delete(':trainingId')
  @Auth()
  async deleteTraining(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
  ) {
    const ref = { trainingId };
    await this.trainingService.remove(ref, { user });
    return { id: trainingId };
  }

  @Post(':trainingId/component')
  @Auth()
  async addComponents(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Body() { components }: AddTrainingComponentsDto,
  ) {
    const ref = { trainingId };
    const training = await this.trainingService.addComponents(
      ref,
      components.map((c) => [
        c.id,
        { ...c, supersets: [{ order: 0, exercises: {} }] },
      ]),
      user,
    );

    return this.trainingService.map(training);
  }

  @Patch(':trainingId/component/:componentId')
  @Auth()
  async updateComponent(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
    @Body() data: UpdateTrainingComponentDto,
  ) {
    const ref = { trainingId, componentId };
    const training = await this.trainingService.updateComponent(
      ref,
      data,
      user,
    );

    return this.trainingService.map(training);
  }

  @Delete(':trainingId/component/:componentId')
  @Auth()
  async deleteComponent(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
  ) {
    const ref = { trainingId, componentId };
    await this.trainingService.deleteComponent(ref, user);
    return { id: componentId };
  }

  @Post(':trainingId/component/:componentId/superset')
  @Auth()
  async addSuperset(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
    @Body() input: AddTrainingSupersetDto,
  ) {
    const ref = { trainingId, componentId };
    const training = await this.trainingService.addSupersets(
      ref,
      [input],
      user,
    );

    return this.trainingService.map(training);
  }

  @Patch(':trainingId/component/:componentId/superset/:supersetId')
  @Auth()
  async updateSuperset(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
    @Param('supersetId') superset: number,
    @Body() data: UpdateTrainingSupersetDto,
  ) {
    const ref = { trainingId, componentId, superset };
    const training = await this.trainingService.updateSuperset(ref, data, user);
    return this.trainingService.map(training);
  }

  @Delete(':trainingId/component/:componentId/superset/:supersetId')
  @Auth()
  async deleteSuperset(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
    @Param('supersetId') superset: number,
  ) {
    const ref = { trainingId, componentId, superset };
    await this.trainingService.deleteSuperset(ref, user);
    return { id: superset };
  }

  @Post(':trainingId/component/:componentId/superset/:supersetId/exercise')
  @Auth()
  async addExercises(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
    @Param('supersetId') superset: number,
    @Body() input: AddTrainingExercisesDto,
  ) {
    const ref = { trainingId, componentId, superset };
    const data = input.exercises.map((item) => [item.id, item]) as [
      string,
      TrainingExercise,
    ][];

    const training = await this.trainingService.addExercises(ref, data, user);
    return this.trainingService.map(training);
  }

  @Patch(
    ':trainingId/component/:componentId/superset/:supersetId/exercise/:exerciseId',
  )
  @Auth()
  async updateExercise(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
    @Param('supersetId') superset: number,
    @Param('exerciseId') exerciseId: string,
    @Body() data: UpdateTrainingExerciseDto,
  ) {
    const ref = { trainingId, componentId, superset, exerciseId };
    const training = await this.trainingService.updateExercise(ref, data, user);
    return this.trainingService.map(training);
  }

  @Delete(
    ':trainingId/component/:componentId/superset/:supersetId/exercise/:exerciseId',
  )
  @Auth()
  async deleteExercise(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
    @Param('supersetId') superset: number,
    @Param('exerciseId') exerciseId: string,
  ) {
    const ref = { trainingId, componentId, superset, exerciseId };
    await this.trainingService.deleteExercise(ref, user);
    return { id: exerciseId };
  }

  @Patch(
    ':trainingId/component/:componentId/superset/:supersetId/exercise/:exerciseId/set',
  )
  @Auth()
  async updateSet(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
    @Param('supersetId') superset: number,
    @Param('exerciseId') exerciseId: string,
    @Body() data: UpdateAthleteSetDataDto,
  ) {
    const ref = {
      trainingId,
      componentId,
      superset,
      exerciseId,
      userId: user.uid,
    };

    await this.trainingWorkloadService.updateSets(ref, data.sets);
    return { id: exerciseId };
  }
}
