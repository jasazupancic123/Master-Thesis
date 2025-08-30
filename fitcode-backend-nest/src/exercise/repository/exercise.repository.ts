import { Injectable } from '@nestjs/common';
import {
  CollectionReference,
  DocumentReference,
} from 'firebase-admin/firestore';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { CommonService } from '@src/common/service/common.service';
import { Create, Update } from '@src/common/type/entity.type';
import { FirestoreRepository } from '@src/common/type/firestore.type';
import { FirebaseService } from '@src/firebase/firebase.service';

import { Exercise } from '../entity/exercise.entity';

@Injectable()
export class ExerciseRepository extends FirestoreRepository<Exercise> {
  collectionName = FirestoreCollection.EXERCISE;

  constructor(
    readonly firebaseService: FirebaseService,
    private readonly commonService: CommonService,
  ) {
    super(firebaseService);
  }

  collection(): CollectionReference {
    return this.firebaseService.firestore.collection(this.collectionName);
  }

  doc(ref: string): DocumentReference {
    return this.collection().doc(ref);
  }

  async save(input: Create<Omit<Exercise, 'attributeValues'>>) {
    const { id } = this.collection().doc();
    const query = this.firebaseService.buildCreateQuery<Exercise>(
      {
        id,
        ownerId: input.ownerId,
        name: input.name,
        componentIds: input.componentIds,
        isBilateral: input.isBilateral || false,
        imageUrl: input.imageUrl,
        videoUrl: input.videoUrl,
        instruction: input.instruction || '',
        attributeValues: undefined,
        muscleValues: input.muscleValues || [],
      },
      { timestamps: true },
    );

    await this.doc(id).set(query);
    return id;
  }

  async update(exerciseId: string, input: Update<Exercise>) {
    const data = this.firebaseService.buildUpdateQuery(input);
    await this.doc(exerciseId).update(data);
  }

  async delete(exerciseId: string) {
    // soft delete
    const query = this.firebaseService.buildUpdateQuery<Exercise>({
      deletedAt: new Date(),
    });

    await this.doc(exerciseId).update(query);
  }

  slug(name: string, institutionTitle?: string): string {
    const nameSlug = this.commonService.string.slug(name).toLowerCase();
    if (!institutionTitle) return nameSlug;

    const institutionSlug = this.commonService.string
      .slug(institutionTitle)
      .toLowerCase();

    return `${nameSlug}-${institutionSlug}`;
  }
}
