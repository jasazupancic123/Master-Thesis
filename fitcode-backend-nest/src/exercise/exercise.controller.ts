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

import { Auth } from '../common/decorator/auth.decorator';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { User } from '../common/type/firebase-auth.type';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { CreateExercisesDto } from './dto/create-exercises.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { ExerciseService } from './service/exercise.service';

@ApiTags('Exercise')
@Controller('exercise')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Get('global')
  @Auth()
  async findAllGlobal(@Query() query?: Record<string, string>) {
    return this.exerciseService.findAllGlobal(query);
  }

  @Get('institution/:institutionId')
  @Auth()
  async findAll(
    @Param('institutionId') institutionId: string,
    @Query() query?: Record<string, string>,
  ) {
    return this.exerciseService.findAllByInstitution(institutionId, query);
  }

  @Post()
  @Auth()
  async create(@RequestUser() user: User, @Body() data: CreateExerciseDto) {
    return this.exerciseService.create(user, data);
  }

  @Post('many')
  @Auth()
  async createMany(
    @RequestUser() user: User,
    @Body() data: CreateExercisesDto,
  ) {
    return this.exerciseService.createMany(
      user,
      data.exercises.map((e) => ({ ...e, ownerId: user.uid })),
    );
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
