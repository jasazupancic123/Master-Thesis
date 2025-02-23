import { Injectable } from '@nestjs/common';
import { endOfHour, startOfHour } from 'date-fns';
import { CommonService } from 'src/common/service/common.service';
import { Update } from 'src/common/type/entity.type';
import { TrainingComponentRef } from 'src/common/type/firestore.type';
import { TrainingComponent } from '../entity/training-component.entity';
import { Training } from '../entity/training.entity';

@Injectable()
export class TrainingPlanService {
  constructor(private readonly commonService: CommonService) {}

  getAddComponentsQuery(
    training: Training,
    input: Update<TrainingComponent>[],
  ): [Partial<Training>, Training] {
    const query: Partial<Training> = {
      components: [
        ...training.components,
        ...input.map((c) => ({
          id: c.id,
          color: c.color,
          from: c.from ? c.from : startOfHour(new Date()),
          to: c.to ? c.to : endOfHour(new Date()),
          subgroups: [],
          supersets: [{ exercises: [] }],
        })),
      ],
    };

    training.components = query.components;
    return [query, training];
  }

  getDeleteComponentQuery(
    training: Training,
    ref: TrainingComponentRef,
  ): [Partial<Training>, Training] {
    const updatedComponents = training.components.filter(
      (c) => c.id !== ref.componentId,
    );

    const query = {
      components: updatedComponents,
    };

    training.components = updatedComponents;
    return [query, training];
  }
}
