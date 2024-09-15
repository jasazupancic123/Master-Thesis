import { Injectable } from '@nestjs/common';
import {
  FirestoreCollectionRepository,
  TrainingComponentRef,
  TrainingSupersetRef,
} from '../../common/type/firebase-firestore.type';
import { TrainingSuperset } from '../entity/training-superset.entity';
import { CommonService } from '../../common/service/common.service';
import { TrainingComponentRepository } from './training-component.repository';
import {
  DocumentReference,
  DocumentSnapshot,
  Query,
  QueryDocumentSnapshot,
} from 'firebase-admin/lib/firestore';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';

@Injectable()
export class TrainingSupersetRepository
  implements
    FirestoreCollectionRepository<TrainingSuperset, TrainingSupersetRef>
{
  constructor(
    private readonly commonService: CommonService,
    private readonly trainingComponentRepository: TrainingComponentRepository,
  ) {}

  async getLastOrder(ref: Required<TrainingComponentRef>): Promise<number> {
    const snapshot = await this.collection(ref)
      .orderBy('order', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) return 0;
    return snapshot.docs[0].get('order');
  }

  async getDocs(
    ref: Required<TrainingComponentRef>,
    query: (ref: Query) => Query = (ref) => ref,
  ): Promise<TrainingSuperset[]> {
    const snapshot = await query(this.collection(ref)).get();
    return snapshot.docs.map((doc) => this.serialize(doc));
  }

  async getDoc(
    ref: Required<TrainingSupersetRef>,
  ): Promise<TrainingSuperset | null> {
    const snapshot = await this.doc(ref).get();
    if (!snapshot.exists) return null;
    return this.serialize(snapshot);
  }

  async addDoc(
    ref: Required<TrainingComponentRef>,
    data: Partial<TrainingSuperset>,
  ) {
    const result = await this.collection(ref).add({
      componentId: ref.componentId,
      order: data.order,
      color: data.color || this.commonService.color.random(),
    });

    return result.id;
  }

  async updateDoc(
    ref: Required<TrainingSupersetRef>,
    input: Partial<TrainingSuperset>,
  ) {
    const data = this.commonService.object.clean(input);
    await this.doc(ref).update(data);
  }

  doc(ref: Required<TrainingSupersetRef>): DocumentReference {
    return this.collection(ref).doc(ref.supersetId);
  }

  collection(ref: Required<TrainingComponentRef>) {
    return this.trainingComponentRepository
      .doc(ref)
      .collection(FirestoreCollection.TRAINING_SUPERSET);
  }

  serialize(
    snapshot: DocumentSnapshot | QueryDocumentSnapshot,
  ): TrainingSuperset {
    const data = snapshot.data();

    return {
      id: snapshot.id,
      componentId: data.componentId,
      order: +data.order,
      color: data.color,
      exercises: [],
    };
  }
}
