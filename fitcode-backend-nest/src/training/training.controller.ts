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
import { CommonService } from '../common/service/common.service';
import { Auth } from '../common/decorator/auth.decorator';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { User } from '../common/type/firebase-auth.type';
import { AddTrainingComponentsDto } from './dto/add-training-components.dto';
import { CopyTrainingDto } from './dto/copy-training.dto';
import { CreateTrainingDto } from './dto/create-training.dto';
import { FilterTrainingQueryDto } from './dto/filter-training-query.dto';
import {
  BatchUpdateTrainingsDto,
  UpdateSingleTrainingDto,
} from './dto/update-training.dto';
import { TrainingService } from './service/training.service';
import { FinishComponentDto } from './dto/finish-component.dto';
import { Workload } from './entity/workload.entity';
import { FindAthleteGroupWorkloads } from './dto/find-workload.dto';

@Controller('training')
export class TrainingController {
  constructor(
    private readonly commonService: CommonService,
    private readonly trainingService: TrainingService,
  ) {}

  @Get()
  @Auth()
  async findAll(
    @RequestUser() user: User,
    @Query() filter: FilterTrainingQueryDto,
  ) {
    filter = this.commonService.object.clean(filter);

    return this.trainingService.findAll(user, {
      groupId: filter.groupId,
      cycleId: filter.cycleId,
      ...(filter.from && { from: filter.from }),
      ...(filter.to && { to: filter.to }),
    });
  }

  @Get(':trainingId/component/:componentId')
  @Auth()
  async findByIdAndPopulateAthleteWorkloads(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
  ) {
    const ref = { trainingId, componentId };
    return await this.trainingService.findByIdAndPopulateAthleteWorkloads(
      user,
      ref,
    );
  }

  @Post('group/:groupId/athlete/:athleteId/workloads')
  @Auth()
  async findAthleteGroupWorkloads(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('athleteId') athleteId: string,
    @Body() body: FindAthleteGroupWorkloads,
  ) {
    return await this.trainingService.findAthleteGroupWorkloads(
      user,
      { groupId, uid: athleteId },
      body,
    );
  }

  @Post()
  @Auth()
  async create(
    @RequestUser() user: User,
    @Body()
    body: CreateTrainingDto,
  ) {
    return await this.trainingService.create(user, body);
  }

  @Patch(':trainingId')
  @Auth()
  async update(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Body() body: UpdateSingleTrainingDto,
  ) {
    const ref = { trainingId };
    return await this.trainingService.update(user, ref, body);
  }

  @Patch('batch/group/:groupId/cycle/:cycleId')
  @Auth()
  async batchUpdate(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
    @Body() body: BatchUpdateTrainingsDto,
  ) {
    const ref = { groupId, cycleId };
    return await this.trainingService.batchUpdate(user, ref, body);
  }

  @Post(':trainingId/copy')
  @Auth()
  async copy(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Body() body: CopyTrainingDto,
  ) {
    const ref = { trainingId };
    return await this.trainingService.copy(user, ref, body);
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

  @Patch(':trainingId/finish/:componentId/component')
  @Auth()
  async finishComponent(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
    @Body() body: FinishComponentDto,
  ) {
    const ref = { trainingId, componentId };
    return await this.trainingService.finishComponent(user, ref, body);
  }

  @Post(':trainingId/component')
  @Auth()
  async addComponents(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Body() { components }: AddTrainingComponentsDto,
  ) {
    return await this.trainingService.addComponents(
      user,
      { trainingId },
      components,
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
