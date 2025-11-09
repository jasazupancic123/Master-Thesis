import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { endOfDay, startOfDay } from 'date-fns';

import { DateFilterDto } from '@src/common/dto/date-filter.dto';
import { DateRangeDto } from '@src/common/dto/date-range.dto';
import { UserIdDto } from '@src/common/dto/user-id.dto';
import {
  TrainingComponentRef,
  WorkloadRef,
} from '@src/common/type/firestore.type';
import { InstitutionService } from '@src/institution/service/institution.service';
import { TrainingReportService } from '@src/training/service/training-report.service';

import { UserRole } from '../auth/enum/user-role.enum';
import { Auth } from '../common/decorator/auth.decorator';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { CommonService } from '../common/service/common.service';
import { User } from '../common/type/firebase-auth.type';
import { AddTrainingComponentsDto } from './dto/add-training-components.dto';
import { CreateTrainingDto } from './dto/create-training.dto';
import { FilterTrainingQueryDto } from './dto/filter-training-query.dto';
import { PeriodizeTrainingsDto } from './dto/periodize-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import {
  UpdateTrainingStatusDto,
  UpdateTrainingStatusForUserDto,
} from './dto/update-training-status.dto';
import { Training } from './entity/training.entity';
import { CreateWorkload, Workload } from './entity/workload.entity';
import { TrainingService } from './service/training.service';

@ApiTags('Training')
@Controller('training')
export class TrainingController {
  constructor(
    private readonly commonService: CommonService,
    private readonly trainingService: TrainingService,
    private readonly trainingReportService: TrainingReportService,
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
        ...(filter.cycleId && { cycleId: filter.cycleId }),
        ...(filter.from && { from: filter.from }),
        ...(filter.to && { to: filter.to }),
      },
      { limit: filter?.limit },
      filter?.populate,
    );
  }

  @Get(':trainingId')
  @Auth()
  async findOneById(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
  ) {
    const ref = { trainingId, userId: user.uid };
    const training = await this.trainingService.findOneByIdOrFail(user, ref, {
      skipInstitution: true,
    });

    const report = await this.trainingReportService.findById(ref);
    return { training, report };
  }

  @Get('report/athlete')
  @Auth()
  async findReports(@RequestUser() user: User, @Query() filter: DateFilterDto) {
    filter = this.commonService.object.clean(filter);
    return await this.trainingService.findReportsByUser(user, {
      ...(filter.from && { from: filter.from }),
      ...(filter.to && { to: filter.to }),
    });
  }

  /**
   * Endpoint for Smart Wall service to get all trainings for institution
   * for today
   */
  @Get('/institution/today')
  @Auth([UserRole.MANAGER])
  @ApiBearerAuth()
  @ApiOperation({
    summary: `Get today's trainings for institution`,
    description: `Get all trainings for the institution managed by the authenticated user for today.`,
  })
  @ApiNotFoundResponse({ description: 'Institution not found' })
  @ApiOkResponse({
    description: 'List of trainings for institution',
    type: () => Training,
    isArray: true,
  })
  async findAllByInstitutionToday(
    @RequestUser() user: User,
  ): Promise<Training[]> {
    const institution = await this.institutionService.findByOwnerId(user.uid);
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
      false,
    );
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

  @Post(':trainingId/exercise/:exerciseId/complete-next-set')
  @Auth([UserRole.MANAGER, UserRole.TRAINER, UserRole.ATHLETE])
  @ApiBearerAuth()
  @ApiBody({ type: Workload })
  @ApiParam({
    name: 'exerciseId',
    required: true,
    description: 'ID of the exercise',
    examples: {
      curl: { value: 'arm-curl-db', description: 'Dumbbell Arm Curl' },
      deadlift: { value: 'deadlift', description: 'Deadlift' },
      squat: { value: 'deep-back-squat', description: 'Barbell Squat' },
      bench: { value: 'bench-press-bb', description: 'Barbell Bench Press' },
      pushup: { value: 'push-up-fly', description: 'Push Up' },
      shoulderPress: {
        value: 'military-press-db',
        description: 'Shoulder Press',
      },
      splitSquat: {
        value: 'bulgarian-split-squat',
        description: 'Split Squat',
      },
    },
  })
  @ApiOperation({
    summary: 'Complete next uncompleted set for exercise in training',
    description:
      'Complete next uncompleted set for exercise in training for the user specified in body. If userId not specified, completes for the authenticated user.',
  })
  @ApiNotFoundResponse({ description: 'Training or exercise not found' })
  @ApiOkResponse({ description: 'Set completed successfully' })
  async completeNextSet(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('exerciseId') exerciseId: string,
    @Body() body: CreateWorkload,
  ) {
    const ref = { trainingId, exerciseId, userId: body.userId };
    return await this.trainingService.completeNextSet(user, ref, body);
  }

  @Post(':trainingId/component/:cId/exercise/:eId/superset/:i/set/:s')
  @Auth([UserRole.MANAGER, UserRole.TRAINER, UserRole.ATHLETE])
  async upsertSet(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('cId') componentId: string,
    @Param('eId') exerciseId: string,
    @Param('i', ParseIntPipe) supersetIndex: number,
    @Param('s', ParseIntPipe) setNumber: number,
    @Body() body: CreateWorkload,
  ) {
    if (supersetIndex < 0)
      throw new BadRequestException('Superset index must be 0 or greater');
    if (setNumber < 1)
      throw new BadRequestException('Set number must be 1 or greater');

    const ref: WorkloadRef = {
      trainingId,
      componentId,
      exerciseId,
      supersetIndex,
      setNumber,
      userId: body.userId,
    };

    return await this.trainingService.upsertSet(user, ref, body);
  }

  @Post(':trainingId/component/:cId/start')
  @Auth([UserRole.MANAGER, UserRole.TRAINER, UserRole.ATHLETE])
  async startTrainingComponent(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('cId') componentId: string,
  ) {
    const ref: TrainingComponentRef = { trainingId, componentId };
    return await this.trainingService.startTrainingComponent(user, ref);
  }

  /**
   * Finalize a training component by updating the training reports' statuses.
   */
  @Post(':trainingId/component/:cId/finalize')
  @Auth([UserRole.MANAGER, UserRole.TRAINER, UserRole.ATHLETE])
  async finalizeTrainingComponent(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('cId') componentId: string,
    @Body() { status }: UpdateTrainingStatusDto,
  ) {
    const ref: TrainingComponentRef = { trainingId, componentId };
    return await this.trainingService.finalizeTrainingComponent(
      user,
      ref,
      status,
    );
  }

  /**
   * Only allows updating training component status, does not finalize reports.
   */
  @Post(':trainingId/component/:cId/status')
  @Auth([UserRole.MANAGER, UserRole.TRAINER, UserRole.ATHLETE])
  async updateTrainingComponentStatus(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('cId') componentId: string,
    @Body() body: UpdateTrainingStatusForUserDto,
  ) {
    const ref: TrainingComponentRef = { trainingId, componentId };
    return await this.trainingService.updateStatus(user, ref, {
      status: body.status,
      uid: body.userId,
    });
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
