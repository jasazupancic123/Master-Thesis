import { Injectable } from '@nestjs/common';
import { RootFirestoreCollectionRepository } from '../../common/type/firebase-firestore.type';
import { Component } from '../entity/component.entity';
import { CommonService } from '../../common/service/common.service';
import { FirebaseService } from '../../firebase/firebase.service';
import {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  Query,
  QueryDocumentSnapshot,
} from 'firebase-admin/lib/firestore';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';

@Injectable()
export class ComponentRepository implements RootFirestoreCollectionRepository<Component> {
  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
  ) {
  }

  async getDocs(query: (query: Query) => Query = query => query): Promise<Component[]> {
    const snapshot = await query(this.collection()).get();
    return snapshot.docs.map(doc => this.serialize(doc));
  }

  async getDoc(slug: string): Promise<Component | null> {
    const snapshot = await this.doc(slug).get();
    if (!snapshot.exists) return null;
    return this.serialize(snapshot);
  }

  async addDoc(input: Partial<Component>) {
    const slug = await this.slug(input.name);
    await this.doc(slug).set({
      id: slug,
      slug,
      parent: input.parent ?? null,
      name: input.name,
    });

    return slug;
  }

  async updateDoc(slug: string, input: Partial<Component>) {
    const data = this.commonService.object.clean(input);
    await this.doc(slug).update(data);
  }

  doc(slug: string): DocumentReference {
    return this.collection().doc(slug);
  }

  collection(): CollectionReference {
    return this.firebaseService.firestore.collection(FirestoreCollection.COMPONENT);
  }

  serialize(snapshot: DocumentSnapshot | QueryDocumentSnapshot): Component {
    const data = snapshot.data();

    return {
      id: snapshot.id,
      slug: snapshot.id,
      parent: data.parent ?? null,
      name: data.name,
      children: data.children ?? [],
      parents: data.parents ?? [],
    };
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