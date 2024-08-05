import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TrainingService } from './training.service';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { CustomClaims } from '../common/type/custom-claims.type';
import { TrainingFilterDto } from './dto/training-filter.dto';
import { CycleService } from '../cycle/cycle.service';
import { Auth } from '../common/decorator/auth.decorator';
import { CreateSetGroupDto } from './dto/create-set-group.dto';
import { AddExerciseToSetSubgroupDto } from './dto/create-set-exercise.dto';

@Controller('training')
export class TrainingController {
  constructor(
    private readonly cycleService: CycleService,
    private readonly trainingService: TrainingService,
  ) {
  }

  @Post()
  @Auth()
  async createTraining(
    @RequestUser() user: CustomClaims,
    @Body() data: CreateTrainingDto,
  ) {
    return await this.trainingService.create(user, data);
  }

  @Post('set-group')
  @Auth()
  async addSetGroup(
    @RequestUser() user: CustomClaims,
    @Body() data: CreateSetGroupDto,
  ) {
    return await this.trainingService.addSetGroup(user, data);
  }

  @Post('set-subgroup/:id')
  @Auth()
  async addExerciseToSetSubgroup(
    @RequestUser() user: CustomClaims,
    @Param('id') setSubgroupId: string,
    @Body() data: AddExerciseToSetSubgroupDto,
  ) {
    return await this.trainingService.addExerciseToSetSubgroup(user, {
      setSubgroupId,
      exerciseIds: data.exerciseIds,
      ...data,
    } as AddExerciseToSetSubgroupDto & { setSubgroupId: string });
  }

  @Get()
  async findAll(
    @RequestUser() user: CustomClaims,
    @Query() filter: TrainingFilterDto,
  ) {
    const cycle = await this.cycleService.findOneById(user, filter.cycleId);
    if (!cycle)
      return [];

    return await this.trainingService.findAll(user, cycle, filter);
  }

  @Get(':id')
  async findOne(
    @RequestUser() user: CustomClaims,
    @Param('id') id: string,
  ) {
    return await this.trainingService.findOneById(user, id);
  }

  @Patch(':id')
  async update(
    @RequestUser() user: CustomClaims,
    @Param('id') id: string,
    @Body() data: UpdateTrainingDto,
  ) {
    return await this.trainingService.update(user, id, data);
  }

  @Delete(':id')
  async remove(
    @RequestUser() user: CustomClaims,
    @Param('id') id: string,
  ) {
    return await this.trainingService.remove(user, id);
  }
}
