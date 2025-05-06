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
  UpdateTrainingDto,
  UpdateTrainingDtoWithId,
  UpdateTrainingDtoWithWarmupAndCooldown,
} from './dto/update-training.dto';
import { TrainingService } from './service/training.service';
import { CreateWorkloadsDto } from './dto/create-workload.dto';
import { TrainingComponent } from './entity/training-component.entity';

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

  @Post()
  @Auth()
  async create(@RequestUser() user: User, @Body() body: CreateTrainingDto) {
    return await this.trainingService.create(user, body);
  }

  @Post(':trainingId/withComponent')
  @Auth()
  async createWithTrainingComponent(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Body() body: { trainingComponent: TrainingComponent, date: {from: Date, to: Date} },
  ) {
    const ref = { trainingId };
    return await this.trainingService.createWithTrainingComponent(user, ref, body);
  }

  @Patch(':trainingId')
  @Auth()
  async update(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Body() body: UpdateTrainingDtoWithWarmupAndCooldown,
  ) {
    const ref = { trainingId };
    return await this.trainingService.update(user, ref, body);
  }

  @Patch(':trainingId/multiple')
  @Auth()
  async updateMultiple(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Body() body: UpdateTrainingDtoWithId[],
  ) {
    return await this.trainingService.updateMultiple(user, body);
  }

  @Patch(':trainingId/component/copy')
  @Auth()
  async copyComponent(
    @RequestUser() user: User,
    @Param('trainingId') trainingId: string,
    @Body()
    body: {
      trainingComponent: TrainingComponent;
      copiedFromTrainingId: string;
      overwrite?: boolean;
    },
  ) {
    const ref = { trainingId };
    return await this.trainingService.copyComponent(user, ref, body);
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
