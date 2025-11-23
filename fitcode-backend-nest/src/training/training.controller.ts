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

import { UserRole } from '@src/auth/enum/user-role.enum';
import { Auth } from '@src/common/decorator/auth.decorator';
import { RequestUser } from '@src/common/decorator/request-user.decorator';
import { DateRangeDto } from '@src/common/dto/date-range.dto';
import { OptionalUserIdDto, UserIdDto } from '@src/common/dto/user-id.dto';
import { CommonService } from '@src/common/service/common.service';
import { User } from '@src/common/type/firebase-auth.type';
import {
  TrainingComponentRef,
  TrainingProtocolRef,
  WorkloadRef,
} from '@src/common/type/firestore.type';
import { InstitutionService } from '@src/institution/service/institution.service';

import { AddTrainingComponentsDto } from './dto/add-training-components.dto';
import { CreateTrainingDto } from './dto/create-training.dto';
import { FilterTrainingQueryDto } from './dto/filter-training-query.dto';
import { PeriodizeTrainingsDto } from './dto/periodize-training.dto';
import { TrainingActionPayloadDto } from './dto/training-action.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { Training } from './entity/training.entity';
import { TrainingComponentUserStatus } from './entity/training-component-user-status.entity';
import {
  CreateTrainingProtocolDto,
  UpdateTrainingProtocolDto,
} from './entity/training-protocol.entity';
import { CreateWorkload, Workload } from './entity/workload.entity';
import { ActiveTrainingService } from './service/active-training.service';
import { TrainingService } from './service/training.service';
import { TrainingProtocolService } from './service/training-protocol.service';
import { TrainingReportService } from './service/training-report.service';
import { SmartWallTraining } from './type/smart-wall.type';

@ApiTags('Training')
@Controller('training')
export class TrainingController {
  constructor(
    private readonly commonService: CommonService,
    private readonly institutionService: InstitutionService,
    private readonly trainingService: TrainingService,
    private readonly activeTrainingService: ActiveTrainingService,
    private readonly trainingProtocolService: TrainingProtocolService,
    private readonly trainingReportService: TrainingReportService,
  ) {}

  @Get()
  @Auth()
  async findAll(
    @RequestUser() user: User,
    @Query() filter: FilterTrainingQueryDto,
  ) {
    let { institutionId, ...rest } = filter;
    rest = this.commonService.object.clean(rest);

    return await this.trainingService.findAll(
      user,
      institutionId,
      {
        groupId: rest.groupId,
        ...(rest.cycleId && { cycleId: rest.cycleId }),
        ...(rest.from && { from: rest.from }),
        ...(rest.to && { to: rest.to }),
      },
      { limit: rest?.limit },
      rest?.populate,
    );
  }

  @Get(':trainingId/individual')
  @Auth([UserRole.MANAGER, UserRole.TRAINER])
  async findAllIndividual(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
  ): Promise<Record<string, Training>> {
    const training = await this.trainingService.findOneByIdOrFail(user, {
      trainingId,
    });

    return await this.trainingService.findAllIndividual(
      training,
      training.membersIds,
    );
  }

  @Get('get/active')
  @Auth([UserRole.ATHLETE])
  async getActiveTraining(@RequestUser() user: User): Promise<
    | (Training & {
        workloads: Workload[];
        statuses: TrainingComponentUserStatus[];
      })
    | null
  > {
    return await this.activeTrainingService.getActiveTrainingByAthlete(
      user,
      user.uid,
    );
  }

  @Post(':trainingId/component/:cId/generate-qr-code')
  @Auth([UserRole.MANAGER, UserRole.TRAINER])
  async generateQRCode(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('cId') componentId: string,
    @Body() { userId }: UserIdDto,
  ) {
    const link = await this.activeTrainingService.generateQRCode(user, {
      trainingId,
      componentId,
      uid: userId,
    });

    return { link };
  }

  @Get('report/athlete')
  @Auth()
  async findReports(
    @RequestUser() user: User,
    @Query() filter: FilterTrainingQueryDto,
  ) {
    return await this.trainingReportService.findReportsByUser(
      user,
      filter.institutionId,
    );
  }

  /**
   * Endpoint for Smart Wall service to get all trainings for institution
   * for today
   */
  @Get('institution/today')
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
  ): Promise<SmartWallTraining[]> {
    const institution = await this.institutionService.findByOwnerId(user.uid);
    if (!institution)
      throw new NotFoundException('Institution not found for manager');

    const trainings = await this.trainingService.findAll(
      user,
      institution.id,
      {
        institutionId: institution.id,
        from: startOfDay(new Date()),
        to: endOfDay(new Date()),
      },
      {},
      false,
    );

    const result: SmartWallTraining[] = [];
    for (const training of trainings) {
      result.push({
        trainingId: training.id,
        users: training.membersIds.map((uid) => ({
          uid,
          exercises: training.components.flatMap((component) =>
            component.supersets.flatMap((superset) =>
              superset.exercises.map((exercise) => exercise),
            ),
          ),
        })),
      });
    }

    return result;
  }

  @Post('institution/:institutionId/protocol')
  @Auth([UserRole.MANAGER, UserRole.TRAINER])
  async createProtocol(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
    @Body()
    body: CreateTrainingProtocolDto,
  ) {
    return await this.trainingProtocolService.create(user, institutionId, body);
  }

  @Patch('institution/:institutionId/protocol/:protocolId')
  @Auth([UserRole.MANAGER, UserRole.TRAINER])
  async updateProtocol(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
    @Param('protocolId') protocolId: string,
    @Body()
    body: UpdateTrainingProtocolDto,
  ) {
    const ref: TrainingProtocolRef = { institutionId, protocolId };
    return await this.trainingProtocolService.update(user, ref, body);
  }

  @Delete('institution/:institutionId/protocol/:protocolId')
  @Auth([UserRole.MANAGER, UserRole.TRAINER])
  async deleteProtocol(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
    @Param('protocolId') protocolId: string,
  ) {
    const ref = { institutionId, protocolId };
    await this.trainingProtocolService.delete(user, ref);
    return {};
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
    return await this.trainingService.createForInstitution(user, body);
  }

  @Auth()
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

  @Patch(':trainingId/move')
  @Auth([UserRole.MANAGER, UserRole.TRAINER])
  async move(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Body() body: DateRangeDto,
  ) {
    return await this.trainingService.move(user, { trainingId }, body);
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
    @Body() { userId }: OptionalUserIdDto,
  ) {
    const ref: TrainingComponentRef = { trainingId, componentId };
    return await this.activeTrainingService.startTrainingComponent(
      user,
      ref,
      userId,
    );
  }

  /**
   * Finalize a training component by updating the training reports' statuses.
   */
  @Post(':trainingId/component/:cId/complete')
  @Auth([UserRole.MANAGER, UserRole.TRAINER, UserRole.ATHLETE])
  async completeTrainingComponent(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('cId') componentId: string,
    @Body() { userId }: OptionalUserIdDto,
  ) {
    const ref: TrainingComponentRef = { trainingId, componentId };
    return await this.activeTrainingService.completeTrainingComponent(
      user,
      ref,
      userId,
    );
  }

  /**
   * Only allows updating training component status, does not finalize reports.x
   */
  @Patch(':trainingId/component/:cId/pause')
  @Auth([UserRole.MANAGER, UserRole.TRAINER, UserRole.ATHLETE])
  async pauseTrainingComponent(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('cId') componentId: string,
  ) {
    const ref: TrainingComponentRef = { trainingId, componentId };
    return await this.activeTrainingService.pauseComponent(user, ref);
  }

  @Get('report/group')
  @Auth([UserRole.MANAGER, UserRole.TRAINER])
  async getGroupReport(
    @RequestUser() user: User,
    @Query('institutionId') institutionId: string,
    @Query('groupId') groupId: string,
    @Query('componentId') componentId: string,
  ) {
    return await this.trainingReportService.getGroupReport(
      user,
      { institutionId, groupId },
      componentId,
    );
  }

  @Get('report/athlete/trainings-realization')
  @Auth([UserRole.MANAGER, UserRole.TRAINER])
  async getUserTrainingsRealizationReport(
    @RequestUser() user: User,
    @Query('institutionId') institutionId: string,
    @Query('athleteId') athleteId: string,
    @Query('componentId') componentId?: string,
  ) {
    return await this.trainingReportService.getTrainingsRealizationReport(
      user,
      institutionId,
      athleteId,
      componentId,
    );
  }

  @Get('report/athlete/exercise/:exerciseId')
  @Auth([UserRole.MANAGER, UserRole.TRAINER, UserRole.ATHLETE])
  async getUserExerciseReport(
    @RequestUser() user: User,
    @Param('exerciseId') exerciseId: string,
    @Query('institutionId') institutionId: string,
    @Query('athleteId') athleteId: string,
  ) {
    return await this.trainingReportService.getUserExerciseReport(
      user,
      institutionId,
      exerciseId,
      athleteId,
    );
  }

  /**
   * Allowes athlete to modify their own training prescription -
   * they can add exercises
   */
  @Post(':trainingId/modify')
  @Auth([UserRole.MANAGER, UserRole.TRAINER, UserRole.ATHLETE])
  async modifyTraining(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Body() { action, ref, payload }: TrainingActionPayloadDto,
  ) {
    return await this.trainingService.modifyTraining(
      user,
      trainingId,
      action,
      ref,
      payload,
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
