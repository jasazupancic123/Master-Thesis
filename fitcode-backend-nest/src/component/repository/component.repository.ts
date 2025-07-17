import { Injectable } from '@nestjs/common';
import {
  CollectionReference,
  DocumentReference,
  Query,
} from 'firebase-admin/lib/firestore';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { CommonService } from '@src/common/service/common.service';
import { Create, FirestoreEntity, Update } from '@src/common/type/entity.type';
import { RootFirestoreCollectionRepository } from '@src/common/type/firestore.type';
import { FirebaseService } from '@src/firebase/firebase.service';

import { Component } from '../entity/component.entity';

@Injectable()
export class ComponentRepository
  implements RootFirestoreCollectionRepository<Component>
{
  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async getDocs(
    query: (query: Query) => Query = (query) => query,
  ): Promise<Component[]> {
    const snapshot = await query(this.collection()).get();
    return snapshot.docs.map((doc) =>
      this.firebaseService.serialize(doc.data() as FirestoreEntity<Component>),
    );
  }

  async getDoc(slug: string): Promise<Component | null> {
    const snapshot = await this.doc(slug).get();
    if (!snapshot.exists) return null;

    const data = snapshot.data() as FirestoreEntity<Component>;
    return this.firebaseService.serialize(data);
  }

  async addDoc(input: Create<Component>) {
    const slug = await this.slug(input.name);

    const query = this.firebaseService.buildCreateQuery<Component>({
      id: slug,
      slug,
      parentId: input.parentId || null,
      targets: input.targets || [],
      name: input.name,
      attributes: input.attributes,
      params: input.params || null,
    });

    await this.doc(slug).set(query);
    return slug;
  }

  async updateDoc(
    slug: string,
    input: Update<Component, 'name' | 'parentId' | 'slug'>,
  ) {
    const query = this.firebaseService.buildUpdateQuery<Component>(input);
    await this.doc(slug).update(query);
  }

  async deleteDoc(slug: string) {
    await this.doc(slug).delete();
  }

  doc(slug: string): DocumentReference {
    return this.collection().doc(slug);
  }

  collection(): CollectionReference {
    return this.firebaseService.firestore.collection(
      FirestoreCollection.COMPONENT,
    );
  }

  private async slug(name: string): Promise<string> {
    const slug = this.commonService.string.slug(name);
    const snapshot = await this.getDoc(slug);

    if (snapshot) {
      // slug already exists, add number to the end
      const lastNumberMatch = slug.match(/\d+$/);
      const number = lastNumberMatch ? +lastNumberMatch[0] : 0;
      return `${slug}-${number + 1}`;
    }

    return slug;
  }
}
