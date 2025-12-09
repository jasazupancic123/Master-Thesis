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
    readonly firebase: FirebaseService,
    private readonly commonService: CommonService,
  ) {
    super(firebase);
  }

  collection(): CollectionReference {
    return this.firebase.firestore.collection(this.collectionName);
  }

  doc(ref: string): DocumentReference {
    return this.collection().doc(ref);
  }

  async save(input: Create<Exercise>) {
    const query = this.firebase.buildCreateQuery<Exercise>(
      {
        id: input.id,
        ownerId: input.ownerId,
        institutionId: input.institutionId,
        name: input.name,
        imageUrl: input.imageUrl,
        videoUrl: input.videoUrl,
        instruction: input.instruction || '',
        disabled: input.disabled || false,
        coeffRel: input.coeffRel || 1,
        coeffLoad: input.coeffLoad || 0.5,
        coeffBw: input.coeffBw || 0.5,
        coeff1Rm: input.coeff1Rm || 1.5,
        params: input.params || [],
        isUnilateral: input.isUnilateral || false,
        components: input.components || ['other'],
        muscleValues: input.muscleValues || [],
        prescriptions: input.prescriptions || [],
        patterns: input.patterns || [],
        bodyRegions: input.bodyRegions || [],
        equipment: input.equipment || [],
        loadingSides: input.loadingSides || [],
        movementDirections: input.movementDirections || [],
        locations: input.locations || [],
        liftPriorities: input.liftPriorities || [],
      },
      { timestamps: true },
    );

    await this.doc(input.id).set(query);
    return input.id;
  }

  async update(exerciseId: string, input: Update<Exercise>) {
    const data = this.firebase.buildUpdateQuery(input);
    await this.doc(exerciseId).update(data);
  }

  async delete(exerciseId: string) {
    await this.doc(exerciseId).delete();
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
