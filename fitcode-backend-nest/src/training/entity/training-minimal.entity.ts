import { ApiProperty, PickType } from '@nestjs/swagger';
import { Training } from './training.entity';
import { TrainingComponentMinimal } from './training-component-minimal.entity';
import { Type, Expose } from 'class-transformer';
import { ValidateNested } from 'class-validator';

export class TrainingMinimal extends PickType(Training, [
  'id',
  'groupId',
  'cycleId',
  'copiedFromId',
  'avgCompletedWorkloadValues',
  'avgFutureWorkloadValues',
  'from',
  'to',
]) {
  @ValidateNested()
  @Type(() => TrainingComponentMinimal)
  @ApiProperty()
  @Expose()
  warmup: TrainingComponentMinimal; // warmup component

  @ValidateNested()
  @Type(() => TrainingComponentMinimal)
  @ApiProperty()
  @Expose()
  cooldown: TrainingComponentMinimal; // cooldown component

  @ValidateNested({ each: true })
  @Type(() => TrainingComponentMinimal)
  @ApiProperty()
  @Expose()
  components: TrainingComponentMinimal[];
}
