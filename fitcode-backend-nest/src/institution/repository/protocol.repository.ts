import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  CollectionGroup,
  CollectionReference,
  DocumentReference,
} from 'firebase-admin/firestore';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { CommonService } from '@src/common/service/common.service';
import { Create, Update } from '@src/common/type/entity.type';
import {
  FirestoreRepository,
  InstitutionRef,
  TrainingProtocolRef,
} from '@src/common/type/firestore.type';
import { FirebaseService } from '@src/firebase/firebase.service';
import { TrainingProtocol } from '@src/training/entity/training-protocol.entity';

import { InstitutionRepository } from './institution.repository';

@Injectable()
export class ProtocolRepository extends FirestoreRepository<
  TrainingProtocol,
  TrainingProtocolRef
> {
  collectionName = FirestoreCollection.TRAINING_PROTOCOLS;
  private _parent?: InstitutionRepository;

  constructor(
    readonly firebase: FirebaseService,
    readonly common: CommonService,
    private readonly moduleRef: ModuleRef,
  ) {
    super(firebase);
  }

  get parent(): InstitutionRepository {
    if (!this._parent)
      this._parent = this.moduleRef.get(InstitutionRepository, {
        strict: false,
      });

    return this._parent;
  }

  collection(ref: InstitutionRef): CollectionReference {
    return this.parent.doc(ref.institutionId).collection(this.collectionName);
  }

  collectionGroup(): CollectionGroup {
    return this.firebase.firestore.collectionGroup(this.collectionName);
  }

  doc(ref: TrainingProtocolRef): DocumentReference {
    return this.collection(ref).doc(ref.protocolId);
  }

  async getAllByInstitution(ref: InstitutionRef): Promise<TrainingProtocol[]> {
    const snapshot = await this.collection(ref).get();
    return snapshot.docs.map((doc) => this.serialize(doc));
  }

  async save(data: Create<TrainingProtocol>, ref: InstitutionRef) {
    const id = this.common.string.slug(data.name);
    const query = this.firebase.buildCreateQuery<TrainingProtocol>({
      ...data,
      id,
    });

    await this.doc({ ...ref, protocolId: id }).set(query);
    return id;
  }

  async update(ref: TrainingProtocolRef, data: Update<TrainingProtocol>) {
    const query = this.firebase.buildUpdateQuery(data);
    await this.doc(ref).update(query);
  }

  async delete(ref: TrainingProtocolRef) {
    await this.doc(ref).delete();
  }
}
