import {
  Body,
  Controller,
  forwardRef,
  Get,
  Inject,
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
import { CacheManagerService } from 'src/cache-manager/cache-manager.service';
import { Wrapper } from 'src/common/type/wrapper.type';

@Controller('exercise')
export class ExerciseController {
  constructor(
    @Inject(forwardRef(() => CacheManagerService))
    private readonly cacheManagerService: Wrapper<CacheManagerService>,
    private readonly exerciseAttributeService: ExerciseAttributeService,
    private readonly exerciseService: ExerciseService,
  ) {}

  @Get('attribute')
  async findAllAttributes() {
    return await this.cacheManagerService.getAttributes();
  }

  @Get()
  @Auth()
  async findExercises(
    @RequestUser() user: User,
    // @Query() query: FilterExerciseDto, // NOTE - filtering is done on frontend
  ) {
    return await this.exerciseService.findAll(user);
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
