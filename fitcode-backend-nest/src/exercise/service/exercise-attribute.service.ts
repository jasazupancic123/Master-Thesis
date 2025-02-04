import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CommonService } from '../../common/service/common.service';
import { ExerciseAttributeRepository } from '../repository/exercise-attribute.repository';
import { ExerciseAttribute } from '../entity/exercise-attribute.entity';
import { CacheManagerService } from 'src/cache-manager/cache-manager.service';
import { Wrapper } from 'src/common/type/wrapper.type';

@Injectable()
export class ExerciseAttributeService {
  constructor(
    @Inject(forwardRef(() => CacheManagerService))
    private readonly cacheManagerService: Wrapper<CacheManagerService>,
    private readonly commonService: CommonService,
    private readonly exerciseAttributeRepository: ExerciseAttributeRepository,
  ) {}

  async findAll(): Promise<ExerciseAttribute[]> {
    return await this.exerciseAttributeRepository.getDocs();
  }

  async create(input: Partial<ExerciseAttribute>): Promise<ExerciseAttribute> {
    const id = await this.exerciseAttributeRepository.addDoc(input);
    return { ...input, field: id } as ExerciseAttribute;
  }

  async update(input: Partial<ExerciseAttribute>): Promise<ExerciseAttribute> {
    if (!input.field) throw new Error('Exercise attribute field is required');

    const oldExerciseAttribute = await this.exerciseAttributeRepository.getDoc(
      input.field,
    );

    const data = {
      field: input.field,
      name: input.name,
      required: input.required,
      type: input.type,
      unit: input.unit,
      values: input.values,
    };

    // update exercise attribute
    await this.exerciseAttributeRepository.updateDoc(input.field, data);

    // TODO - update all exercise attribute values if values changed
    if (
      !this.commonService.array.equals(
        input.values,
        oldExerciseAttribute.values,
      )
    ) {
      // TODO
    }

    return { ...oldExerciseAttribute, ...data };
  }

  async validate(input: Record<string, any>): Promise<void> {
    const attributes = await this.cacheManagerService.getAttributes();
    const fields = attributes.map((attribute) => attribute.field);

    for (const field of Object.keys(input))
      if (!fields.includes(field))
        throw new BadRequestException(`Attribute ${field} does not exist`);
  }
}
