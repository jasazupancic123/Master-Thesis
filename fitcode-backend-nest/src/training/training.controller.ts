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
  BatchUpdateTrainingsWithCustomAthleteWorkloadsDto,
  UpdateSingleTrainingDto,
  UpdateTrainingDto,
} from './dto/update-training.dto';
import { TrainingService } from './service/training.service';
import { CreateWorkloadsDto } from './dto/create-workload.dto';
import { TrainingComponent } from './entity/training-component.entity';
import { ComponentRef, TrainingRef } from '../common/type/firestore.type';
import { Superset } from './entity/superset.entity';
import { FinishComponentDto } from './dto/finish-component.dto';
import { Workload } from './entity/workload.entity';
import { PeriodizeTrainingsDto } from './dto/periodize-training.dto';
import { FindWorkloadsByExercises } from './dto/find-workload.dto';
import { FindByDayDto } from './dto/find-by-day.dto';

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

  @Post('/:groupId/day')
  @Auth()
  async findByDay(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Body() body: FindByDayDto,
  ) {
    return await this.trainingService.findByDay(user, { groupId }, body);
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

  @Post(':groupId/:athleteId/workloads')
  @Auth()
  async getUserWorkloadsByGroupIdAndExerciseIds(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('athleteId') athleteId: string,
    @Body() body: FindWorkloadsByExercises,
  ) {
    return await this.trainingService.getUserWorkloadsByGroupIdAndExerciseIds(
      user,
      {
        groupId,
        body: { exerciseIds: body.exerciseIds, athleteId },
      },
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

  @Post('/periodize/trainings')
  async periodizeTrainings(
    @RequestUser() user: User,
    @Body() body: PeriodizeTrainingsDto,
  ) {
    return await this.trainingService.periodizeTrainings(user, body);
  }

  // @Post(':trainingId/withComponent')
  // @Auth()
  // async createWithTrainingComponent(
  //   @RequestUser() user: User,
  //   @Param('trainingId') trainingId: string,
  //   @Body()
  //   body: {
  //     trainingComponent: TrainingComponent;
  //     date: { from: Date; to: Date };
  //   },
  // ) {
  //   const ref = { trainingId };
  //   return await this.trainingService.createWithTrainingComponent(
  //     user,
  //     ref,
  //     body,
  //   );
  // }

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

  @Patch('batch/:groupId/:cycleId')
  @Auth()
  async batchUpdate(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
    @Body() body: BatchUpdateTrainingsWithCustomAthleteWorkloadsDto,
  ) {
    const ref = { groupId, cycleId };
    return await this.trainingService.batchUpdate(user, ref, body);
  }

  // @Patch(':trainingId/component/copy')
  // @Auth()
  // async copyComponent(
  //   @RequestUser() user: User,
  //   @Param('trainingId') trainingId: string,
  //   @Body()
  //   body: {
  //     trainingComponent: TrainingComponent;
  //     copiedFromTrainingId: string;
  //     overwrite?: boolean;
  //   },
  // ) {
  //   const ref = { trainingId };
  //   return await this.trainingService.copyComponent(user, ref, body);
  // }

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

  @Patch(':trainingId/component/:componentId')
  @Auth()
  async updateWorkloads(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Param('componentId') componentId: string,
    @Body() { workloads }: CreateWorkloadsDto,
  ) {
    const ref = { trainingId, componentId, userId: user.uid };
    await this.trainingService.updateWorkloads(user, ref, workloads);
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
    const ref = { trainingId, componentId } as TrainingRef & ComponentRef;
    return await this.trainingService.finishComponent(user, ref, body);
  }

  /* @Get(':trainingId/status')
  @Auth()
  async getTrainingStatus(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
  ) {
    return await this.trainingService.findAllStatusesByTraining(user, {
      trainingId,
    });
  } */

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
