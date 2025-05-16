import { INestApplication } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { ComponentService } from '../../component/component.service';
import { Component } from '../../component/entity/component.entity';
import { Exercise } from '../../exercise/entity/exercise.entity';
import { ExerciseService } from '../../exercise/service/exercise.service';
import { FirebaseService } from '../../firebase/firebase.service';
import { GroupService } from '../../group/group.service';
import { SportLevel } from '../../user/enum/sport-level.enum';
import { UserRole } from '../../user/enum/user-role.enum';
import { UserRepository } from '../../user/repository/user.repository';
import { UserService } from '../../user/user.service';
import { FirestoreCollection } from '../enum/firestore-collection.enum';
import { User } from '../type/firebase-auth.type';
import { BaseSetup } from './base.setup';
import { Attribute } from '../../attribute/entity/attribute.entity';
import { AttributeService } from '../../attribute/service/attribute.service';
import { InstitutionService } from 'src/institution/service/institution.service';

export class DataSetup extends BaseSetup {
  private readonly firebaseService: FirebaseService;
  private readonly userService: UserService;
  private admin: User;

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

    await this.clearData();

    try {
      await this.importUsers('data/users.json');
      await this.importAttributes('data/attributes.json');
      await this.importComponents('data/components.json');
      await this.importExercises('data/exercises.json');

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

  private async importExercises(filename: string) {
    const exerciseService = this.app.get(ExerciseService);

    const file = await readFile(filename, 'utf-8');
    const data: Omit<Exercise, 'id' | 'ownerId' | 'attributes'>[] =
      JSON.parse(file);

    await exerciseService.createMany(this.admin, data);
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
      createdUsers.map((user) => {
        const u = data.find((u) => u.email === user.email);
        userRepository.addDoc({
          id: user.uid,
          level: (u?.level as SportLevel) || SportLevel.BEGINNER,
        });

        this.userService.addOrUpdateWellness(
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

    const trainer = users.find((u) => u.email === 'trainer@mail.com');
    const athletes = users.filter((u) => u.customClaims.role?.includes(UserRole.ATHLETE));

    const institution = await institutionService.create(this.admin, {
      name: 'Nk Maribor',
      ownerId: users[0].uid,
      trainerIds: trainer ? [trainer.uid] : users.map((u) => u.uid),
      athleteIds: athletes.map((u) => u.uid),
      imageUrl: 'https://img.sofascore.com/api/v1/team/2420/image',
    });

    // import groups
    const groupIds = [];
    for (const trainer of users) {
      const groups = data.find((u) => u.email === trainer.email)?.groups;
      for (const { name, membersIds: emails } of groups) {
        const members = await this.userService.findAll({ emails });
        const membersIds = members.map((m) => m.uid);
        const group = await groupService.create(trainer, {
          group: { name, membersIds },
          institutionId: institution.id,
        });
        groupIds.push(group.id);

        for (const member of members)
          await this.userService.addTrainer({ uid: member.uid }, trainer.uid);
      }
    }

    institution.groupIds = groupIds;
    await institutionService.update(
      trainer,
      { institutionId: institution.id },
      {
        groupIds: institution.groupIds,
      },
    );
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
