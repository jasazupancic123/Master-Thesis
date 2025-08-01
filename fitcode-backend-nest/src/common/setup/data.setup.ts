import type { INestApplication } from '@nestjs/common';
import { readFile } from 'node:fs/promises';

import { GLOBAL_EXERCISE_OWNER } from '@src//exercise/constant/global-exercise-owner.constant';
import type { Attribute } from '@src/attribute/entity/attribute.entity';
import { AttributeService } from '@src/attribute/service/attribute.service';
import { ComponentService } from '@src/component/component.service';
import type { Component } from '@src/component/entity/component.entity';
import type { Exercise } from '@src/exercise/entity/exercise.entity';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { FirebaseService } from '@src/firebase/firebase.service';
import { GroupService } from '@src/group/group.service';
import { InstitutionService } from '@src/institution/service/institution.service';
import type { Method } from '@src/method/entity/method.entity';
import { MethodService } from '@src/method/service/method.service';
import { SportLevel } from '@src/user/enum/sport-level.enum';
import { UserRole } from '@src/user/enum/user-role.enum';
import { UserRepository } from '@src/user/repository/user.repository';
import { UserService } from '@src/user/user.service';

import { FirestoreCollection } from '../enum/firestore-collection.enum';
import type { User } from '../type/firebase-auth.type';
import { BaseSetup } from './base.setup';

export class DataSetup extends BaseSetup {
  private readonly firebaseService: FirebaseService;
  private readonly userService: UserService;

  private admin: User;
  private manager: User;
  private trainer: User;

  constructor(app: INestApplication) {
    super(app);
    this.firebaseService = app.get(FirebaseService);
    this.userService = app.get(UserService);
  }

  /**
   * A special collection for local dev is used to check if data has been
   * inserted or not. If the flag is `false`, data is imported and flag
   * set to `true`, else if the flag is `true`, nothing gets imported.
   */
  async setup() {
    const time = performance.now();
    if (await this.isInit()) return;

    // create / update admin user
    this.admin = await this.userService.upsert({
      email: this.configService.getOrThrow('FIREBASE_ADMIN_EMAIL'),
      password: this.configService.getOrThrow('FIREBASE_ADMIN_PASSWORD'),
      displayName: 'Admin',
      customClaims: { role: [UserRole.ADMIN] },
    });

    this.manager = await this.userService.upsert({
      email: 'manager@mail.com',
      password: 'password',
      displayName: 'Manager',
      customClaims: { role: [UserRole.MANAGER] },
    });

    this.trainer = await this.userService.upsert({
      email: 'trainer@mail.com',
      password: 'password',
      displayName: 'Trainer',
      customClaims: { role: [UserRole.TRAINER] },
    });

    await this.clearData();

    try {
      await this.importUsers('data/users.json');
      await this.importAttributes('data/attributes.json');
      await this.importComponents('data/components.json');
      await this.importExercises('data/exercises.json');
      await this.importMethods('data/methods.json');

      this.logger.debug(
        `Data setup took ${(performance.now() - time) / 1000}s`,
      );
    } catch (e) {
      this.logger.error('Failed to import data');
      console.error(e);
    }

    await this.setInit();
  }

  private async clearData() {
    await this.firebaseService.deleteCollection(FirestoreCollection.GROUP);
    await this.firebaseService.deleteCollection(FirestoreCollection.EXERCISE);
    await this.firebaseService.deleteCollection(FirestoreCollection.COMPONENT);
    await this.firebaseService.deleteCollection(FirestoreCollection.ATTRIBUTE);
    await this.firebaseService.deleteCollection(FirestoreCollection.USER);
    await this.firebaseService.deleteCollection(FirestoreCollection.METHOD);
    await this.firebaseService.deleteCollection(FirestoreCollection.TRAINING);
    await this.firebaseService.deleteCollection(
      FirestoreCollection.INSTITUTION,
    );
  }

  private async importAttributes(filename: string) {
    const attributeService = this.app.get(AttributeService);

    const file = await readFile(filename, 'utf-8');
    const data: Attribute[] = JSON.parse(file);

    for (const item of data) await attributeService.create(item);
  }

  private async importComponents(filename: string) {
    const componentService = this.app.get(ComponentService);

    const file = await readFile(filename, 'utf-8');
    const data: (Omit<Component, 'children' | 'parents'> & {
      children: Component[];
    })[] = JSON.parse(file);

    for (const c of data) await componentService.createFromTree(c);
  }

  private async importMethods(filename: string) {
    const methodsService = this.app.get(MethodService);

    const file = await readFile(filename, 'utf-8');
    const data: Method[] = JSON.parse(file);

    for (const m of data) await methodsService.create(this.admin, m);
  }

  private async importExercises(filename: string) {
    const exerciseService = this.app.get(ExerciseService);

    const file = await readFile(filename, 'utf-8');
    const data: Omit<Exercise, 'id' | 'ownerId' | 'attributes'>[] =
      JSON.parse(file);

    await exerciseService.createMany(
      this.admin,
      data.map((d) => ({ ...d, ownerId: GLOBAL_EXERCISE_OWNER })),
    );
  }

  private async importUsers(filename: string) {
    const userRepository = this.app.get(UserRepository);
    const groupService = this.app.get(GroupService);
    const institutionService = this.app.get(InstitutionService);

    const file = await readFile(filename, 'utf-8');
    const data: {
      email: string;
      role: UserRole;
      level: string;
      displayName: string;
      weight: number;
      groups: {
        name: string;
        membersIds: string[];
      }[];
    }[] = JSON.parse(file);

    const createdUsers: User[] = [];
    for (const userData of data) {
      createdUsers.push(
        await this.userService.upsert({
          email: userData.email,
          displayName: userData.displayName,
          password: 'password',
          customClaims: { role: [userData.role || UserRole.ATHLETE] },
        }),
      );
    }

    await Promise.all(
      createdUsers.map(async (user) => {
        const u = data.find((u) => u.email === user.email);
        await userRepository.addDoc({
          id: user.uid,
          level: (u?.level as SportLevel) || SportLevel.BEGINNER,
        });

        await this.userService.addOrUpdateWellness(
          { uid: user.uid, date: new Date() },
          {
            userId: user.uid,
            date: new Date(),
            weight: u.weight,
            sleep: 5,
            fatigue: 5,
            soreness: 5,
            comment: 'Average day today',
          },
        );
      }),
    );

    const users = await this.userService.findAll({
      emails: data.map((u) => u.email),
    });

    const athletes = users.filter((u) =>
      u.customClaims?.role?.includes(UserRole.ATHLETE),
    );

    const institution = await institutionService.create(this.admin, {
      name: 'Nk Maribor',
      ownerId: this.manager.uid,
      imageUrl: 'https://img.sofascore.com/api/v1/team/2420/image',
    });

    await institutionService.updateMembers(
      this.admin,
      { institutionId: institution.id },
      {
        add: true,
        memberIds: athletes.map((u) => u.uid),
        trainers: false,
      },
    );

    await institutionService.updateMembers(
      this.admin,
      { institutionId: institution.id },
      {
        add: true,
        memberIds: [this.trainer.uid],
        trainers: true,
      },
    );

    // import groups
    const groupIds = [];
    const groups = data.find((u) => u.email === this.trainer.email)?.groups;

    for (const { name, membersIds: emails } of groups) {
      const members = await this.userService.findAll({ emails });
      const membersIds = members.map((m) => m.uid);
      const group = await groupService.create(this.manager, {
        name,
        ownerId: this.trainer.uid,
        membersIds,
        institutionId: institution.id,
      });

      groupIds.push(group.id);
    }
  }

  private async isInit() {
    const localDevCollection = this.firebaseService.firestore.collection(
      FirestoreCollection.LOCAL_DEV,
    );

    return (
      (await localDevCollection.get()).docs?.[0]?.data()?.inserted || false
    );
  }

  private async setInit() {
    const localDevCollection = this.firebaseService.firestore.collection(
      FirestoreCollection.LOCAL_DEV,
    );

    await localDevCollection.add({ inserted: true });
  }
}
