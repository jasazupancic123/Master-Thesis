import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TrainingService } from './training.service';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { User } from '../common/type/custom-claims.type';
import { TrainingFilterDto } from './dto/training-filter.dto';
import { CycleService } from '../cycle/cycle.service';
import { Auth } from '../common/decorator/auth.decorator';
import { AddSetExerciseDto } from './dto/create-set-exercise.dto';
import { SetService } from '../set/set.service';
import { SuperExerciseInfo } from '../exercise-info/entity/super-exercise-info.entity';
import { UpdateSetExerciseDto } from './dto/update-set-exercise.dto';
import { AddSetDto } from './dto/add-set.dto';

@Controller('training')
export class TrainingController {
  constructor(
    private readonly cycleService: CycleService,
    private readonly trainingService: TrainingService,
    private readonly setService: SetService,
  ) {
  }

  @Get()
  async findAll(@RequestUser() user: User, @Query() filter: TrainingFilterDto) {
    return await this.trainingService.findAll(user, { filter });
  }

  @Get(':id')
  async findOne(@RequestUser() user: User, @Param('id') id: string) {
    return await this.trainingService.findOneById(user, id);
  }

  @Post()
  @Auth()
  async create(@RequestUser() user: User, @Body() data: CreateTrainingDto) {
    return await this.trainingService.create(user, data);
  }

  @Post('set')
  @Auth()
  async addSet(@RequestUser() user: User, @Body() data: AddSetDto) {
    return await this.setService.createSetGroup(data);
  }

  @Get(':id/set/:setGroupId')
  @Auth()
  async getSet(
    @RequestUser() user: User,
    @Param('id') trainingId: string,
    @Param('setGroupId') setGroupId: string,
  ) {
    const training = await this.trainingService.findOneByIdOrFail(user, trainingId);
    const cycle = await this.cycleService.findOneByIdOrFail(user, training.cycleId);
    if (!cycle)
      return [];

    return await this.setService.findSetGroupById(user, setGroupId);
  }

  @Post('set/subgroup/:setSubgroupId')
  @Auth()
  async addSetExercise(
    @RequestUser() user: User,
    @Param('setSubgroupId') setSubgroupId: string,
    @Body() body: AddSetExerciseDto,
  ) {
    const { exerciseIds, ...data } = body;
    return await this.setService.addExercisesToSetGroup(user, setSubgroupId, exerciseIds, data as Partial<SuperExerciseInfo>);
  }

  @Patch('set/subgroup/exercise/:setExerciseId')
  async updateSetExercise(
    @RequestUser() user: User,
    @Param('setExerciseId') setExerciseId: string,
    @Body() data: UpdateSetExerciseDto,
  ) {
    return await this.setService.updateExercise(user, setExerciseId, data as Partial<SuperExerciseInfo>);
  }

  @Patch(':id')
  async update(
    @RequestUser() user: User,
    @Param('id') id: string,
    @Body() data: UpdateTrainingDto,
  ) {
    return await this.trainingService.update(user, id, data);
  }

  @Delete(':id')
  async remove(@RequestUser() user: User, @Param('id') id: string) {
    await this.trainingService.remove(user, id);
    return {};
  }
}
