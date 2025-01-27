import { UpdateTraining } from '../type/training.type';
import { DateFilterDto } from '../../common/dto/date-filter.dto';

export class UpdateTrainingDto
  extends DateFilterDto
  implements Omit<UpdateTraining, 'membersIds'> {}
