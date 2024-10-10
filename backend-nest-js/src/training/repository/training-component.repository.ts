import { Injectable } from '@nestjs/common';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  Query,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import {
  FirestoreCollectionRepository,
  TrainingComponentRef,
  TrainingRef,
} from '../../common/type/firebase-firestore.type';
import { TrainingComponent } from '../entity/training-component.entity';
import { TrainingRepository } from './training.repository';
import { CommonService } from '../../common/service/common.service';

@Injectable()
export class TrainingComponentRepository
  implements
    FirestoreCollectionRepository<TrainingComponent, TrainingComponentRef>
{
  constructor(
    private readonly commonService: CommonService,
    private readonly trainingRepository: TrainingRepository,
  ) {}

  /**
   * Returns the last order of the training components in the training.
   */
  async getLastOrder(ref: Required<TrainingRef>): Promise<number> {
    const snapshot = await this.collection(ref)
      .orderBy('order', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) return 0;
    return snapshot.docs[0].get('order');
  }

  async getDocs(
    ref: Required<TrainingRef>,
    query: (ref: Query) => Query = (ref) => ref,
  ): Promise<TrainingComponent[]> {
    const snapshot = await query(this.collection(ref)).get();
    return snapshot.docs.map((doc) => this.serialize(doc));
  }

  async getDoc(
    ref: Required<TrainingComponentRef>,
  ): Promise<TrainingComponent | null> {
    const snapshot = await this.doc(ref).get();
    if (!snapshot.exists) return null;
    return this.serialize(snapshot);
  }

  async addDoc(
    ref: Required<TrainingComponentRef>,
    data: Partial<TrainingComponent>,
  ) {
    await this.doc(ref).set({
      componentId: ref.componentId,
      trainingId: ref.trainingId,
      order: data.order,
      color: data.color || this.commonService.color.random(),
    });

    return ref.componentId;
  }

  async updateDoc(
    ref: Required<TrainingComponentRef>,
    input: Partial<TrainingComponent>,
  ) {
    const data = this.commonService.object.clean(input);
    await this.doc(ref).update(data);
  }

  async deleteDoc(ref: Required<TrainingComponentRef>) {
    await this.doc(ref).delete();
  }

  doc(ref: Required<TrainingComponentRef>): DocumentReference {
    return this.collection(ref).doc(ref.componentId);
  }

  collection(ref: Required<TrainingRef>): CollectionReference {
    return this.trainingRepository
      .doc(ref.trainingId)
      .collection(FirestoreCollection.TRAINING_COMPONENT);
  }

  serialize(
    snapshot: DocumentSnapshot | QueryDocumentSnapshot,
  ): TrainingComponent {
    const data = snapshot.data();

    return {
      componentId: snapshot.id,
      trainingId: data.trainingId,
      order: +data.order,
      color: data.color,
      supersets: [],
    };
  }
}
