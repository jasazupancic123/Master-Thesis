import {
  Body,
  Controller,
  Delete,
  forwardRef,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CacheManagerService } from 'src/cache-manager/cache-manager.service';
import { Wrapper } from 'src/common/type/wrapper.type';
import { UserRole } from 'src/user/enum/user-role.enum';
import { Auth } from '../common/decorator/auth.decorator';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { User } from '../common/type/firebase-auth.type';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { CreateExercisesDto } from './dto/create-exercises.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { ExerciseService } from './service/exercise.service';

@Controller('exercise')
export class ExerciseController {
  constructor(
    @Inject(forwardRef(() => CacheManagerService))
    private readonly cacheManagerService: Wrapper<CacheManagerService>,
    private readonly exerciseService: ExerciseService,
  ) {}

  @Get('attribute')
  async findAttributes() {
    return await this.cacheManagerService.getAttributes();
  }

  @Get()
  @Auth()
  async findAll(@RequestUser() user: User) {
    // NOTE - filtering is done on frontend
    return this.exerciseService.findAll(user);
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
    return this.exerciseService.createMany(user, data.exercises);
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
    return this.exerciseService.delete(user, { exerciseId });
  }
}
