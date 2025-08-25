import { Inject, Injectable } from '@nestjs/common';
import {
  CollectionReference,
  DocumentReference,
  FieldValue,
} from 'firebase-admin/firestore';

import { ChangeLogManager } from '@src/change-log/change-log.manager';
import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create, Update } from '@src/common/type/entity.type';
import { FirestoreRepository } from '@src/common/type/firestore.type';
import { BatchWriteOperation } from '@src/common/type/orm.type';
import { FirebaseService } from '@src/firebase/firebase.service';

import { Training } from '../entity/training.entity';
import { TrainingComponent } from '../entity/training-component.entity';

@Injectable()
export class TrainingRepository extends FirestoreRepository<Training> {
  collectionName = FirestoreCollection.TRAINING;

  constructor(
    readonly firebaseService: FirebaseService,
    @Inject(Training)
    readonly changeLog: ChangeLogManager<Training>,
  ) {
    super(firebaseService);
  }

  collection(): CollectionReference {
    return this.firebaseService.firestore.collection(this.collectionName);
  }

  doc(ref: string): DocumentReference {
    return this.collection().doc(ref);
  }

  async save(input: Create<Training>): Promise<string> {
    const { id } = this.collection().doc();
    const query = this.firebaseService.buildCreateQuery<Training>(
      { ...input, id },
      { timestamps: true },
    );

    const ref = this.doc(id);
    this.changeLog.trackCreate(ref);
    await ref.set(query);

    return id;
  }

  async update(id: string, input: Update<Training>) {
    const query = this.firebaseService.buildUpdateQuery<Training>(input);
    const ref = this.doc(id);
    await this.changeLog.trackUpdate(ref);
    await ref.update(query);
  }

  async delete(id: string) {
    const ref = this.doc(id);
    await this.changeLog.trackDelete(ref);
    await ref.delete();
  }

  async addMember(training: Training, memberId: string) {
    const { ref, data } = this.getUpdateMemberOperation(
      training,
      memberId,
      true,
    );

    await this.changeLog.trackUpdate(ref);
    await ref.update(data);
  }

  async removeMember(training: Training, memberId: string) {
    const { ref, data } = this.getUpdateMemberOperation(
      training,
      memberId,
      false,
    );

    await this.changeLog.trackUpdate(ref);
    await ref.update(data);
  }

  getUpdateMemberOperation(
    training: Training,
    memberId: string,
    add: boolean,
  ): BatchWriteOperation<Training> {
    return {
      ref: this.doc(training.id),
      operation: 'update',
      data: {
        ...(!add && {
          completedMembersIds: FieldValue.arrayRemove(
            memberId,
          ) as unknown as string[],
        }),
        membersIds: add
          ? (FieldValue.arrayUnion(memberId) as unknown as string[])
          : (FieldValue.arrayRemove(memberId) as unknown as string[]),
        components: training.components.map((tc) =>
          this.firebaseService.buildCreateQuery<TrainingComponent>({
            ...tc,
            ...(!add && {
              completedMembersIds: tc.completedMembersIds.filter(
                (id) => id !== memberId,
              ),
            }),
            subgroups: tc.subgroups.map((sg) =>
              !add && sg.membersIds.includes(memberId) // remove member from subgroup
                ? {
                    ...sg,
                    membersIds: sg.membersIds.filter((id) => id !== memberId),
                  }
                : sg,
            ),
          }),
        ),
      },
    };
  }
}
