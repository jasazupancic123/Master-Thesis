import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CollectionReference,
  DocumentReference,
  FieldValue,
} from 'firebase-admin/firestore';

import { ChangeLogManager } from '@src/change-log/change-log.manager';
import { DateRangeDto } from '@src/common/dto/date-range.dto';
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

  async updateComponentTime(
    training: Training,
    componentId: string,
    input: DateRangeDto,
  ) {
    const all = [training.warmup, ...training.components, training.cooldown];
    const component = all.find((c) => c.id === componentId);
    if (!component) throw new NotFoundException('Component not found');

    const i = training.components.indexOf(component);
    const prev = i !== 0 ? all[i - 1] : null;
    const next = i !== all.length - 1 ? all[i + 1] : null;

    let query: Update<Training> = {};
    if (!prev)
      // first component, update its `from` and `to` from input and update next component's `from`
      query = {
        from: input.from, // also update training `from`
        components: all.map((c) => {
          if (c.id === componentId)
            return { ...c, from: input.from, to: input.to };

          if (next && c.id === next.id) return { ...c, from: input.to };
          return c;
        }),
      };
    else if (!next)
      // last component, update its `from` and `to` from input and update previous component's `to`
      query = {
        to: input.to, // also update training `to`
        components: all.map((c) => {
          if (c.id === componentId)
            return { ...c, from: input.from, to: input.to };

          if (prev && c.id === prev.id) return { ...c, to: input.from };
          return c;
        }),
      };
    else
      // middle component, update its `from` and `to` from input and update previous component's `to` and next component's `from`
      query = {
        components: all.map((c) => {
          if (c.id === componentId)
            return { ...c, from: input.from, to: input.to };

          if (prev && c.id === prev.id) return { ...c, to: input.from };
          if (next && c.id === next.id) return { ...c, from: input.to };
          return c;
        }),
      };

    // sort by time
    query.components = query.components.sort(
      (a, b) => new Date(a.from).getTime() - new Date(b.from).getTime(),
    );

    await this.update(training.id, query);
  }
}
