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
import { Auth } from '../common/decorator/auth.decorator';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { User } from '../common/type/firebase-auth.type';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { CreateExercisesDto } from './dto/create-exercises.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { ExerciseService } from './service/exercise.service';
import { ExerciseFilterDto } from './dto/exercise-filter.dto';
import { FilterDto } from '../common/dto/filter.dto';

@Controller('exercise')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Get()
  @Auth()
  async findAll(
    @RequestUser() user: User,
    @FilterDto(ExerciseFilterDto) filter?: ExerciseFilterDto,
  ) {
    return this.exerciseService.findAll(user, filter);
  }

  @Get(':exerciseId')
  @Auth()
  async findById(
    @RequestUser() user: User,
    @Param('exerciseId') exerciseId: string,
  ) {
    const ref = { exerciseId };
    return this.exerciseService.findByIdOrFail(user, ref);
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
