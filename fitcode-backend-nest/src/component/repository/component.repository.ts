import { Injectable } from '@nestjs/common';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { CommonService } from '@src/common/service/common.service';
import { Create, Update } from '@src/common/type/entity.type';
import { FirestoreRootRepository } from '@src/common/type/firestore.type';
import { FirebaseService } from '@src/firebase/firebase.service';

import { Component } from '../entity/component.entity';

@Injectable()
export class ComponentRepository extends FirestoreRootRepository<Component> {
  collectionName = FirestoreCollection.COMPONENT;

  constructor(
    private readonly commonService: CommonService,
    readonly firebaseService: FirebaseService,
  ) {
    super(firebaseService);
  }

  async save(input: Create<Component>) {
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

  async update(
    slug: string,
    input: Update<Component, 'name' | 'parentId' | 'slug'>,
  ) {
    const query = this.firebaseService.buildUpdateQuery<Component>(input);
    await this.doc(slug).update(query);
  }

  async delete(slug: string) {
    await this.doc(slug).delete();
  }

  private async slug(name: string): Promise<string> {
    const slug = this.commonService.string.slug(name);
    const snapshot = await this.findById(slug);

    if (snapshot) {
      // slug already exists, add number to the end
      const lastNumberMatch = slug.match(/\d+$/);
      const number = lastNumberMatch ? +lastNumberMatch[0] : 0;
      return `${slug}-${number + 1}`;
    }

    return slug;
  }
}
