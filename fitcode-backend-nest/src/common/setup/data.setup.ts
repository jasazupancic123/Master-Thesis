import type { INestApplication } from '@nestjs/common';
import { subDays } from 'date-fns';
import { readFile } from 'node:fs/promises';
import slugify from 'slugify';

import { AuthService } from '@src/auth/auth.service';
import { UserRole } from '@src/auth/enum/user-role.enum';
import { ComponentService } from '@src/component/component.service';
import type { Component } from '@src/component/entity/component.entity';
import type { CreateExerciseDto } from '@src/exercise/dto/create-exercise.dto';
import type { Exercise } from '@src/exercise/entity/exercise.entity';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { FirebaseService } from '@src/firebase/firebase.service';
import { GroupService } from '@src/group/group.service';
import { InstitutionService } from '@src/institution/service/institution.service';
import type { Method } from '@src/method/entity/method.entity';
import { MethodService } from '@src/method/service/method.service';
import { SportLevel } from '@src/profile/enum/sport-level.enum';
import { ProfileRepository } from '@src/profile/repository/profile.repository';
import { WellnessService } from '@src/profile/service/wellness.service';

import { FirestoreCollection } from '../enum/firestore-collection.enum';
import type { Update } from '../type/entity.type';
import type { User } from '../type/firebase-auth.type';
import { BaseSetup } from './base.setup';

export class DataSetup extends BaseSetup {
  private readonly firebaseService: FirebaseService;
  private readonly authService: AuthService;
  private readonly wellnessService: WellnessService;

  private admin: User;
  private manager: User;
  private trainer: User;

  constructor(app: INestApplication) {
    super(app);
    this.firebaseService = app.get(FirebaseService);
    this.authService = app.get(AuthService);
    this.wellnessService = app.get(WellnessService);
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
    this.admin = await this.authService.upsert({
      uid: 'admin',
      email: this.configService.getOrThrow('ADMIN_EMAIL'),
      password: this.configService.getOrThrow('ADMIN_PASSWORD'),
      displayName: 'Admin',
      role: UserRole.ADMIN,
    });

    this.manager = await this.authService.upsert({
      uid: 'manager',
      email: 'manager@mail.com',
      password: 'password',
      displayName: 'Manager',
      role: UserRole.MANAGER,
    });

    this.trainer = await this.authService.upsert({
      uid: 'trainer',
      email: 'trainer@mail.com',
      password: 'password',
      displayName: 'Trainer',
      role: UserRole.TRAINER,
    });

    await this.clearData();

    try {
      await this.importUsers('data/users.json');
      await this.importComponents('data/components.json');
      await this.importExercises();
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
    await this.firebaseService.deleteCollection(FirestoreCollection.PROFILE);
    await this.firebaseService.deleteCollection(FirestoreCollection.METHOD);
    await this.firebaseService.deleteCollection(FirestoreCollection.TRAINING);
    await this.firebaseService.deleteCollection(
      FirestoreCollection.INSTITUTION,
    );
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

  private async importExercises() {
    const exerciseService = this.app.get(ExerciseService);
    const data: Update<Exercise>[] = [
      { name: 'Squats', componentIds: ['concentric'] },
      { name: 'Deadlifts', componentIds: ['concentric'] },
      { name: 'Bench Press', componentIds: ['concentric'] },
      { name: 'High Plank Reach', componentIds: ['concentric'] },
      { name: 'Power Clean', componentIds: ['concentric'] },
      { name: 'Sprint', componentIds: ['peak-speed'] },
      { name: 'Sleed Acceleration', componentIds: ['resisted'] },
      { name: 'Jogging', componentIds: ['aerobic-capacity'] },
      {
        name: 'Bicep Stretching',
        componentIds: ['passive-stretching'],
        isUnilateral: true,
      },
      {
        name: 'Bulgarian Split Squat',
        componentIds: ['concentric'],
        isUnilateral: true,
      },
    ];

    await exerciseService.upsertMany(this.admin, data as CreateExerciseDto[]);
  }

  private async importUsers(filename: string) {
    const userRepository = this.app.get(ProfileRepository);
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
        await this.authService.upsert({
          uid: slugify(userData.email, { lower: true }),
          email: userData.email,
          displayName: userData.displayName,
          password: 'password',
          role: userData.role || UserRole.ATHLETE,
        }),
      );
    }

    await Promise.all(
      createdUsers.map(async (user) => {
        const u = data.find((u) => u.email === user.email);
        await userRepository.save({
          id: user.uid,
          level: (u?.level as SportLevel) || SportLevel.BEGINNER,
        });

        // 10 wellness data for each user
        Array.from({
          length: user.email === 'mike.tyson@mail.com' ? 1 : 10,
        }).forEach(async (_, j) => {
          await this.wellnessService.upsert(
            { uid: user.uid, date: subDays(new Date(), j) },
            {
              userId: user.uid,
              date: subDays(new Date(), j),
              weight: u.weight,
              sleep: Math.floor(Math.random() * 10) + 1,
              fatigue: Math.floor(Math.random() * 10) + 1,
              soreness: Math.floor(Math.random() * 10) + 1,
              comment: 'Average day today',
            },
          );
        });
      }),
    );

    const users = await this.authService.findAll(this.admin, {
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

    for (const user of athletes)
      await institutionService.updateMembers(
        this.admin,
        { institutionId: institution.id },
        { add: true, userId: user.uid, trainer: false },
      );

    // add trainer
    await institutionService.updateMembers(
      this.admin,
      { institutionId: institution.id },
      {
        add: true,
        userId: this.trainer.uid,
        trainer: true,
      },
    );

    // import groups
    const groupIds = [];
    const groups = data.find((u) => u.email === this.trainer.email)?.groups;

    for (const { name, membersIds: emails } of groups) {
      const members = await this.authService.findAll(this.admin, { emails });
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
