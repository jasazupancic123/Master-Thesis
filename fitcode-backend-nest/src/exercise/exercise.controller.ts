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
import { ApiTags } from '@nestjs/swagger';

import { UserRole } from '@src/auth/enum/user-role.enum';

import { Auth } from '../common/decorator/auth.decorator';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { User } from '../common/type/firebase-auth.type';
import {
  CreateExerciseDto,
  UpsertManyExercisesDto,
} from './dto/create-exercise.dto';
import { UpsertManyExerciseMuscleValuesDto } from './dto/create-exercise-muscle-value.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { ExerciseService } from './service/exercise.service';

@ApiTags('Exercise')
@Controller('exercise')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Get('global')
  @Auth()
  async findAllGlobal(
    @RequestUser() user: User,
    @Query() query?: Record<string, string>,
  ) {
    return this.exerciseService.findAllGlobal(user, query);
  }

  @Get('institution/:institutionId')
  @Auth()
  async findAll(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
  ) {
    return await this.exerciseService.findAll(user, institutionId);
  }

  @Post()
  @Auth([UserRole.ADMIN, UserRole.MANAGER])
  async create(@RequestUser() user: User, @Body() data: CreateExerciseDto) {
    return this.exerciseService.create(user, data);
  }

  @Post('many')
  @Auth()
  async upsertMany(
    @RequestUser() user: User,
    @Body() data: UpsertManyExercisesDto,
  ) {
    return this.exerciseService.upsertMany(
      user,
      data.exercises.map((e) => ({ ...e, ownerId: user.uid })),
    );
  }

  @Patch('muscle-values/many')
  @Auth()
  async updateMuscleValues(
    @RequestUser() user: User,
    @Body() data: UpsertManyExerciseMuscleValuesDto,
  ) {
    await this.exerciseService.updateMuscleValues(user, data.exercises);
  }

  @Patch(':exerciseId')
  @Auth()
  async update(
    @RequestUser() user: User,
    @Param('exerciseId') exerciseId: string,
    @Body() body: UpdateExerciseDto,
  ) {
    return this.exerciseService.update(user, { exerciseId }, body);
  }

  @Delete(':exerciseId')
  @Auth()
  async delete(
    @RequestUser() user: User,
    @Param('exerciseId') exerciseId: string,
  ) {
    await this.exerciseService.delete(user, { exerciseId });
    return {};
  }
}
