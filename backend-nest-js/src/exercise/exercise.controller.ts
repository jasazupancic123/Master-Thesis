import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ExerciseService } from './service/exercise.service';
import { Auth } from '../common/decorator/auth.decorator';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { FilterExerciseDto } from './dto/filter-exercise.dto';
import { User } from '../common/type/firebase-auth.type';
import { ExerciseAttributeService } from './service/exercise-attribute.service';

@Controller('exercise')
export class ExerciseController {
  constructor(
    private readonly exerciseAttributeService: ExerciseAttributeService,
    private readonly exerciseService: ExerciseService,
  ) {
  }

  @Get('attribute')
  async findAllAttributes() {
    return await this.exerciseAttributeService.findAll();
  }

  @Get()
  @Auth()
  async findAll(@RequestUser() user: User, @Query() query: FilterExerciseDto) {
    const paginate = {
      orderBy: query.orderBy,
      page: query.page,
      pageSize: query.pageSize,
    };

    const filter = {
      ids: query.ids,
      name: { value: query.name },
      componentIds: { value: query.componentIds },
    };

    return this.exerciseService.findGlobalExercises({ filter, paginate });
  }

  @Get(':exerciseId')
  @Auth()
  async findOneById(@RequestUser() user: User, @Param('exerciseId') exerciseId: string) {
    const ref = { uid: user.uid, exerciseId };
    return await this.exerciseService.findUserExerciseOrFail(user, ref);
  }

  @Post()
  @Auth()
  async create(@RequestUser() user: User, @Body() data: CreateExerciseDto) {
    const ref = { uid: user.uid };
    return await this.exerciseService.createExercise(user, ref, data);
  }
}
