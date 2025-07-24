import { Injectable } from '@nestjs/common';
import { addHours } from 'date-fns';
import type { CollectionReference } from 'firebase-admin/firestore';
import { v4 } from 'uuid';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create, FirestoreEntity } from '@src/common/type/entity.type';
import { getTime } from '@src/common/utils/date.util';
import { FirebaseService } from '@src/firebase/firebase.service';
import { Training } from '@src/training/entity/training.entity';
import { TrainingComponent } from '@src/training/entity/training-component.entity';
import { generateTrainingStub } from '@src/training/mock/training.stub';

@Injectable()
export class TestTrainingService {
  readonly collection: CollectionReference;

  constructor(private readonly firebase: FirebaseService) {
    this.collection = this.firebase.firestore.collection(
      FirestoreCollection.TRAINING,
    );
  }

  async get(trainingId: string): Promise<Training | null> {
    return await this.collection
      .doc(trainingId)
      .get()
      .then((doc) => {
        if (!doc.exists) return null;
        return this.firebase.serialize(doc.data() as FirestoreEntity<Training>);
      });
  }

  async create(
    input: Partial<Create<Training>> & {
      ownerId: string;
      membersIds: string[];
      components?: Omit<TrainingComponent, 'from' | 'to'>[];
      date?: Date; // creates `from` and `to` based on this date, defaults to today at 8:00 - 9:00
    },
  ): Promise<Training> {
    const id = input.id || v4();
    const docRef = this.collection.doc(id);

    const from = input.from || getTime(input.date || new Date(), 8, 0);
    const to = input.to || addHours(from, 1);

    const data = this.firebase.buildCreateQuery(
      generateTrainingStub({ ...input, id, from, to }),
      { timestamps: true },
    );

    await docRef.set(data);

    return this.firebase.serialize(
      (await docRef.get()).data() as FirestoreEntity<Training>,
    );
  }

  async delete(trainingId?: string): Promise<void> {
    if (!trainingId)
      return this.firebase.firestore.recursiveDelete(this.collection);

    // delete workloads
    await this.firebase.firestore.recursiveDelete(
      this.collection
        .doc(trainingId)
        .collection(FirestoreCollection.TRAINING_WORKLOAD),
    );

    // delete training document
    await this.collection.doc(trainingId).delete();
  }

  async deleteCollection(): Promise<void> {
    return await this.firebase.firestore.recursiveDelete(this.collection);
  }
}
