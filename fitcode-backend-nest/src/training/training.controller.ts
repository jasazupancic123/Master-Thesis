import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Auth } from '../common/decorator/auth.decorator';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { User } from '../common/type/firebase-auth.type';
import { AddTrainingComponentsDto } from './dto/add-training-components.dto';
import { CreateTrainingDto } from './dto/create-training.dto';
import { FilterTrainingQueryDto } from './dto/filter-training-query.dto';
import { UpdateAthleteSetDataDto } from './dto/update-athlete-set-data.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { TrainingService } from './service/training.service';

@Controller('training')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Get()
  @Auth()
  async findAll(
    @RequestUser() user: User,
    @Query() filter: FilterTrainingQueryDto,
  ) {
    return this.trainingService.findAll(user, {
      filter: {
        groupId: { value: filter.groupId },
        cycleId: { value: filter.cycleId },
        ...(filter.from && { from: { value: filter.from, op: '>=' } }),
        ...(filter.to && { to: { value: filter.to, op: '<=' } }),
      },
    });
  }

  @Post()
  @Auth()
  async create(@RequestUser() user: User, @Body() body: CreateTrainingDto) {
    return await this.trainingService.create(user, body);
  }

  @Patch(':trainingId')
  @Auth()
  async update(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Body() body: UpdateTrainingDto,
  ) {
    const ref = { trainingId };
    return await this.trainingService.update(user, ref, body);
  }

  @Delete(':trainingId')
  @Auth()
  async delete(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
  ) {
    const ref = { trainingId };
    await this.trainingService.remove(user, ref);
    return {};
  }

  @Patch(
    ':trainingId/component/:componentId/superset/:superset/exercise/:exerciseId/set',
  )
  @Auth()
  async updateAthleteWorkload(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
    @Param('superset', ParseIntPipe) superset: number,
    @Param('exerciseId') exerciseId: string,
    @Body() body: UpdateAthleteSetDataDto,
  ) {
    const ref = {
      trainingId,
      componentId,
      superset,
      exerciseId,
      userId: user.uid,
    };

    await this.trainingService.updateAthleteWorkload(ref, body.sets, user);
    return {};
  }

  @Post(':trainingId/component')
  @Auth()
  async addComponents(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Body() { componentsIds }: AddTrainingComponentsDto,
  ) {
    return await this.trainingService.addComponents(
      user,
      { trainingId },
      componentsIds,
    );
  }

  @Delete(':trainingId/component/:componentId')
  @Auth()
  async deleteComponent(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
  ) {
    const ref = { trainingId, componentId };
    return await this.trainingService.deleteComponent(ref, user);
  }
}
