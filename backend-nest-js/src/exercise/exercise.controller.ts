import { Controller, Post, Body, Get, Param, Patch, Query } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { Auth } from '../common/decorator/auth.decorator';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { DecodedIdToken } from 'firebase-admin/auth';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { FilterExerciseDto } from './dto/filter-exercise.dto';
import { CustomClaims } from '../common/type/custom-claims.type';

@Controller('exercise')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Post()
  @Auth()
  async create(
    @RequestUser() user: CustomClaims,
    @Body() data: CreateExerciseDto
  ) {
    return await this.exerciseService.create(user, data);
  }

  @Get()
  @Auth()
  async findAll(
    @RequestUser() user: CustomClaims,
    @Query() query: FilterExerciseDto,
  ) {
    return this.exerciseService.findAll(user, query);
  }

  @Patch(':id')
  @Auth()
  async update(
    @RequestUser() user: CustomClaims,
    @Param('id') id: string,
    @Body() data: UpdateExerciseDto
  ) {
    return this.exerciseService.update(user, id, data);
  }
}
