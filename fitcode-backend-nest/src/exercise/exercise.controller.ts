import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ExerciseService } from './service/exercise.service';
import { Auth } from '../common/decorator/auth.decorator';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { FilterExerciseDto } from './dto/filter-exercise.dto';
import { User } from '../common/type/firebase-auth.type';
import { ExerciseAttributeService } from './service/exercise-attribute.service';
import { FindManyOptions } from '../common/type/orm.type';
import { Exercise } from './entity/exercise.entity';

@Controller('exercise')
export class ExerciseController {
  constructor(
    private readonly exerciseAttributeService: ExerciseAttributeService,
    private readonly exerciseService: ExerciseService,
  ) {}

  @Get('attribute')
  async findAllAttributes() {
    return await this.exerciseAttributeService.findAll();
  }

  @Get()
  @Auth()
  async findExercises(
    @RequestUser() user: User,
    @Query() query: FilterExerciseDto,
  ) {
    const ref = { uid: user.uid };
    const options: FindManyOptions<Exercise> = {
      filter: {},
      paginate: {},
      populate: ['attributeValues'],
    };

    if (query) {
      // filter
      const { ids, name, componentsIds, global } = query;
      if (ids && ids.length > 0) options.filter.ids = ids;
      if (name) options.filter.name = name;
      if (componentsIds) options.filter.componentsIds = componentsIds;
      if (global) options.filter.global = global;

      // paginate
      const { orderBy, page, pageSize } = query;
      if (orderBy) options.paginate.orderBy = orderBy;
      if (page) options.paginate.page = page;
      if (pageSize) options.paginate.pageSize = pageSize;
    }

    if (Object.keys(options.filter).length === 0) delete options.filter;
    if (Object.keys(options.paginate).length === 0) delete options.paginate;

    return await this.exerciseService.findAllPagination(user, options);
  }

  @Get(':exerciseId')
  @Auth()
  async findOneById(
    @RequestUser() user: User,
    @Param('exerciseId') exerciseId: string,
  ) {
    const ref = { exerciseId };
    return await this.exerciseService.findOneOrFail(ref, {
      userId: user.uid,
    });
  }

  @Post()
  @Auth()
  async create(@RequestUser() user: User, @Body() data: CreateExerciseDto) {
    return await this.exerciseService.create(user, data);
  }

  @Patch(':exerciseId')
  @Auth()
  async update(
    @RequestUser() user: User,
    @Param('exerciseId') exerciseId: string,
    @Body() data: CreateExerciseDto,
  ) {
    const ref = { uid: user.uid, exerciseId };
    return {} as any;
    // return await this.exerciseService.updateExercise(user, ref, data);
  }
}
