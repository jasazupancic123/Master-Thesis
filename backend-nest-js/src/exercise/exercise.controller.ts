import { BadRequestException, Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { Auth } from '../common/decorator/auth.decorator';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { FilterExerciseDto } from './dto/filter-exercise.dto';
import { User } from '../common/type/firebase-auth.type';
import { FirebaseService } from '../firebase/firebase.service';

@Controller('exercise')
export class ExerciseController {
  constructor(private readonly firebaseService: FirebaseService, private readonly exerciseService: ExerciseService) {
  }

  @Get('attribute')
  async findAllAttributes() {
    return await this.exerciseService.findAllAttributes();
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

    return this.exerciseService.findAll(user, { filter, paginate });
  }

  @Get(':id')
  @Auth()
  async findOneById(@RequestUser() user: User, @Param('id') id: string) {
    return await this.exerciseService.findOneById(user, id);
  }

  @Get('meta/page')
  @Auth()
  async getPageMeta(@RequestUser() user: User, @Query() query: FilterExerciseDto) {
    const filter = {
      ids: query.ids,
      name: { value: query.name },
      componentIds: { value: query.componentIds },
    };

    const pageSize = query.pageSize;
    if (!pageSize)
      throw new BadRequestException('Page size is required');

    return await this.exerciseService.getPageMeta(user, filter, pageSize);
  }

  @Post()
  @Auth()
  async create(@RequestUser() user: User, @Body() data: CreateExerciseDto) {
    return await this.exerciseService.create(user, data);
  }
}
