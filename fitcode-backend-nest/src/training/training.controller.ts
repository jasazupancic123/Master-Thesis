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
import { plainToInstance } from 'class-transformer';

import { Auth } from '../common/decorator/auth.decorator';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { CommonService } from '../common/service/common.service';
import { User } from '../common/type/firebase-auth.type';
import { UserRole } from '../user/enum/user-role.enum';
import { AddTrainingComponentsDto } from './dto/add-training-components.dto';
import { CopyComponentDto } from './dto/copy-component.dto';
import { CopyTrainingDto } from './dto/copy-training.dto';
import { CreateTrainingDto } from './dto/create-training.dto';
import { FilterTrainingQueryDto } from './dto/filter-training-query.dto';
import { FindByDayAndPeriodDto } from './dto/find-by-day-period-dto';
import { PeriodizeTrainingsDto } from './dto/periodize-training.dto';
import { TrainingInfoDto } from './dto/training-info.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { CompletedTrainingComponent } from './entity/completed-training.entity';
import { TrainingService } from './service/training.service';

@ApiTags('Training')
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

    const trainings = await this.trainingService.findAll(user, {
      groupId: filter.groupId,
      cycleId: filter.cycleId,
      ...(filter.from && { from: filter.from }),
      ...(filter.to && { to: filter.to }),
    });

    return filter.minimal
      ? plainToInstance(TrainingInfoDto, trainings)
      : trainings;
  }

  @Post('/:groupId/day-period')
  @Auth()
  async findByDayAndPeriod(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Body() body: FindByDayAndPeriodDto,
  ) {
    return await this.trainingService.findByDayAndPeriod(
      user,
      { groupId },
      body,
    );
  }

  @Get(':trainingId/athlete/:athleteId/prescribed')
  @Auth()
  async getPrescribedTraining(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('athleteId') uid: string,
  ) {
    const ref = { trainingId, uid };
    return await this.trainingService.getPrescribedTraining(user, ref);
  }

  @Get(':trainingId/athlete/:athleteId/workloads')
  @Auth()
  async findAthleteWorkloads(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('athleteId') athleteId: string,
  ) {
    return await this.trainingService.findAthleteWorkloads(user, {
      trainingId,
      uid: athleteId,
    });
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

  @Post('/copy/component')
  @Auth()
  async copyComponent(
    @RequestUser() user: User,
    @Body()
    body: CopyComponentDto,
  ) {
    return await this.trainingService.copyComponent(user, body);
  }

  @Post('/periodize/trainings')
  @Auth()
  async periodize(
    @RequestUser() user: User,
    @Body() body: PeriodizeTrainingsDto,
  ) {
    return await this.trainingService.periodize(user, body);
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

  @Patch(':trainingId/component/:componentId/complete')
  @Auth([UserRole.MANAGER, UserRole.TRAINER, UserRole.ATHLETE])
  async completeTrainingComponent(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
    @Body() body: CompletedTrainingComponent,
  ) {
    const ref = { trainingId, componentId };
    return await this.trainingService.completeTrainingComponent(
      user,
      ref,
      body,
    );
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
