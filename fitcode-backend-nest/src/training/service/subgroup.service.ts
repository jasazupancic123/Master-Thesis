import { BadRequestException, Injectable } from '@nestjs/common';
import { Training } from '../entity/training.entity';

@Injectable()
export class SubgroupService {
  findAllByTraining(training: Training) {
    return training.components.flatMap((c) => c.subgroups);
  }

  findById(id: string, training: Training) {
    const subgroups = this.findAllByTraining(training);
    return subgroups.find((s) => s.id === id) || null;
  }

  findByIdOrFail(id: string, training: Training) {
    const item = this.findById(id, training);
    if (!item) throw new BadRequestException('Subgroup does not exist');
    return item;
  }
}
