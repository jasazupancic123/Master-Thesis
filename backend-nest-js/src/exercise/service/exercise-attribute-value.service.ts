import { BadRequestException, Injectable } from '@nestjs/common';
import { CommonService } from '../../common/service/common.service';
import { ExerciseAttributeRepository } from '../repository/exercise-attribute.repository';
import { ExerciseAttributeValueRepository } from '../repository/exercise-attribute-value.repository';
import { ExerciseAttributeValue } from '../entity/exercise-attribute-value.entity';
import {
  ExerciseAttributeRef,
  ExerciseRef,
} from '../../common/type/firebase-firestore.type';
import { FirebaseService } from '../../firebase/firebase.service';
import { ExerciseRepository } from '../repository/exercise.repository';

@Injectable()
export class ExerciseAttributeValueService {
  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly exerciseRepository: ExerciseRepository,
    private readonly exerciseAttributeRepository: ExerciseAttributeRepository,
    private readonly exerciseAttributeValueRepository: ExerciseAttributeValueRepository,
  ) {}

  async findAll(ref: Required<ExerciseRef>): Promise<ExerciseAttributeValue[]> {
    return this.exerciseAttributeValueRepository.getDocs(ref);
  }

  /**
   * Finds all attribute values for an exercise and returns them as a nested
   * object, which is used for frontend display.
   */
  async findAllAsObject(
    ref: Required<ExerciseRef>,
  ): Promise<Record<string, any>> {
    const attributeValues =
      await this.exerciseAttributeValueRepository.getDocs(ref);

    await Promise.all(
      attributeValues.map(async (attributeValue) => {
        attributeValue.attribute =
          await this.exerciseAttributeRepository.getDoc(
            attributeValue.attributeId,
          );
      }),
    );

    // convert found attributes and attribute values to nested object for frontend
    const nested: Record<string, any> = {};
    for (const attributeValue of attributeValues)
      nested[attributeValue.attribute.field] = attributeValue.value;

    return nested;
  }

  /**
   * Creates attribute values for an exercise. It finds each attribute by object
   * key and creates a new attribute value entry for the exercise.
   */
  async createMany(
    ref: Required<ExerciseRef>,
    input: Record<string, any>,
  ): Promise<void> {
    // find attributes by keys
    const attributeValues: ExerciseAttributeValue[] = await Promise.all(
      Object.entries(input).map(async ([field, value]) => {
        const attribute = await this.exerciseAttributeRepository.getDoc(field);
        if (!attribute) throw new BadRequestException('Attribute not found');

        // validate data
        if (!this.commonService.object.isValidValue(attribute, value))
          throw new BadRequestException(
            `Invalid attribute value ${JSON.stringify({ [field]: value })}, possible values: ${JSON.stringify(attribute.values)}`,
          );

        return {
          exerciseId: ref.exerciseId,
          attributeId: attribute.field,
          value,
          attribute: null,
        };
      }),
    );

    // add data
    const batch = this.firebaseService.firestore.batch();
    for (const attributeValue of attributeValues) {
      const document =
        this.exerciseAttributeValueRepository.doc(attributeValue);

      batch.set(document, {
        attributeId: attributeValue.attributeId,
        exerciseId: attributeValue.exerciseId,
        value: attributeValue.value,
      });
    }

    await batch.commit();
  }

  async updateMany(ref: Required<ExerciseAttributeRef>): Promise<void> {
    // find attribute
    const attribute = await this.exerciseAttributeRepository.getDoc(
      ref.attributeId,
    );

    if (!attribute) throw new BadRequestException('Attribute not found');

    // if attribute's type changed to select OR attributes values changed,
    // update all exercises with this attribute to the first new value
    const attributeValues = (
      await this.exerciseRepository
        .attributeValuesCollectionGroup()
        .where('attributeId', '==', ref.attributeId)
        .get()
    ).docs.map((doc) => {
      const serialized = this.exerciseAttributeValueRepository.serialize(doc);
      return { ...serialized, userId: doc.ref.parent.parent.id }; // needed for ref
    });

    const batch = this.firebaseService.firestore.batch();
    for (const attributeValue of attributeValues) {
      const attributeValueRef = {
        uid: attributeValue.userId,
        exerciseId: attributeValue.exerciseId,
        attributeId: attributeValue.attributeId,
      };

      const document =
        this.exerciseAttributeValueRepository.doc(attributeValueRef);
      batch.update(document, { value: attribute.values[0] });
    }

    await batch.commit();
  }
}
