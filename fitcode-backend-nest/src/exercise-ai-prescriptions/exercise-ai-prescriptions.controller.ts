import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Auth } from '../common/decorator/auth.decorator';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { User } from '../common/type/firebase-auth.type';
import { ExerciseAiPrescription } from './entity/exercise-ai-prescriptions';
import { ExerciseAiPrescriptionsService } from './exercise-ai-prescriptions.service';

@ApiTags('Exercise Ai Prescriptions')
@Controller('exercise-ai-prescriptions')
export class ExerciseAiPrescriptionsController {
  constructor(
    private readonly exerciseAiPrescriptionsService: ExerciseAiPrescriptionsService,
  ) {}

  @Get()
  @Auth()
  async findAll() {
    return await this.exerciseAiPrescriptionsService.findAll();
  }

  @Post('upsert-many')
  @Auth()
  async upsertMany(
    @RequestUser() user: User,
    @Body() prescriptions: ExerciseAiPrescription[],
  ) {
    return await this.exerciseAiPrescriptionsService.upsertMany(
      user,
      prescriptions,
    );
  }
}
