import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { endOfDay, startOfDay } from 'date-fns';

import { DateRangeDto } from '@src/common/dto/date-range.dto';
import { UserIdDto } from '@src/common/dto/user-id.dto';
import { InstitutionService } from '@src/institution/service/institution.service';

import { UserRole } from '../auth/enum/user-role.enum';
import { Auth } from '../common/decorator/auth.decorator';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { CommonService } from '../common/service/common.service';
import { User } from '../common/type/firebase-auth.type';
import { AddTrainingComponentsDto } from './dto/add-training-components.dto';
import { CompleteSetDto } from './dto/complete-set.dto';
import { CreateTrainingDto } from './dto/create-training.dto';
import { FilterTrainingQueryDto } from './dto/filter-training-query.dto';
import { PeriodizeTrainingsDto } from './dto/periodize-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { CompletedTrainingComponent } from './entity/completed-training.entity';
import { TrainingService } from './service/training.service';

@ApiTags('Training')
@Controller('training')
export class TrainingController {
  constructor(
    private readonly commonService: CommonService,
    private readonly trainingService: TrainingService,
    private readonly institutionService: InstitutionService,
  ) {}

  @Get()
  @Auth()
  async findAll(
    @RequestUser() user: User,
    @Query() filter: FilterTrainingQueryDto,
  ) {
    filter = this.commonService.object.clean(filter);

    return await this.trainingService.findAll(
      user,
      {
        groupId: filter.groupId,
        cycleId: filter.cycleId,
        ...(filter.from && { from: filter.from }),
        ...(filter.to && { to: filter.to }),
      },
      {},
      filter?.populate,
    );
  }

  /**
   * Endpoint for Smart Wall service to get all trainings for institution
   * for today
   */
  @Get('/institution/today')
  @Auth([UserRole.MANAGER])
  async findAllByInstitutionToday(@RequestUser() user: User) {
    const institution = await this.institutionService.getDocByOwner(user.uid);
    if (!institution)
      throw new NotFoundException('Institution not found for manager');

    return await this.trainingService.findAll(
      user,
      {
        institutionId: institution.id,
        from: startOfDay(new Date()),
        to: endOfDay(new Date()),
      },
      {},
      true,
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
  async findCompletedAthleteWorkloads(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('athleteId') athleteId: string,
  ) {
    return await this.trainingService.findCompletedAthleteWorkloads(user, {
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

  @Patch('/:baseTrainingId/periodize/component/:componentId')
  @Auth()
  async periodize(
    @RequestUser() user: User,
    @Param('baseTrainingId') baseTrainingId: string,
    @Param('componentId') componentId: string,
    @Body() body: PeriodizeTrainingsDto,
  ) {
    return await this.trainingService.copyAndPeriodize(
      user,
      {
        trainingId: baseTrainingId,
        componentId,
        subgroupId: body.subgroupId,
      },
      {
        periodizationType: body.periodizationType,
        exerciseIds: body.exerciseIds,
      },
    );
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

  @Patch(':trainingId/component/:componentId/time')
  @Auth()
  async updateComponentTime(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
    @Body() body: DateRangeDto,
  ) {
    const ref = { trainingId, componentId };
    return await this.trainingService.updateComponentTime(user, ref, body);
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

  @Post(':trainingId/complete-next-set')
  @Auth([UserRole.MANAGER, UserRole.TRAINER, UserRole.ATHLETE])
  async completeNextSet(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Body() body: CompleteSetDto,
  ) {
    const ref = { trainingId, userId: body.userId };
    return await this.trainingService.completeNextSet(user, ref, body);
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

  @Patch(':trainingId/member')
  @Auth([UserRole.MANAGER, UserRole.TRAINER])
  async addMember(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Body() { userId }: UserIdDto,
  ) {
    return await this.trainingService.updateMembers(
      user,
      { trainingId },
      { userId, add: true },
    );
  }

  @Delete(':trainingId/member')
  @Auth([UserRole.MANAGER, UserRole.TRAINER])
  async removeMember(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Body() { userId }: UserIdDto,
  ) {
    return await this.trainingService.updateMembers(
      user,
      { trainingId },
      { userId, add: false },
    );
  }
}
