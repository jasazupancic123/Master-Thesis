import type { INestApplication } from '@nestjs/common';
import { subDays } from 'date-fns';

import { UserRole } from '@src/auth/enum/user-role.enum';
import { AuthService } from '@src/auth/service/auth.service';
import type { CreateExerciseDto } from '@src/exercise/dto/create-exercise.dto';
import type { Exercise } from '@src/exercise/entity/exercise.entity';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { FirebaseService } from '@src/firebase/firebase.service';
import { GroupService } from '@src/institution/service/group.service';
import { InstitutionService } from '@src/institution/service/institution.service';
import { SportLevel } from '@src/profile/enum/sport-level.enum';
import { ProfileRepository } from '@src/profile/repository/profile.repository';
import { WellnessService } from '@src/profile/service/wellness.service';

import { FirestoreCollection } from '../enum/firestore-collection.enum';
import { CommonService } from '../service/common.service';
import type { Update } from '../type/entity.type';
import type { User } from '../type/firebase-auth.type';
import { BaseSetup } from './base.setup';

export class DataSetup extends BaseSetup {
  private readonly firebase: FirebaseService;
  private readonly common: CommonService;
  private readonly authService: AuthService;
  private readonly wellnessService: WellnessService;

  private admin: User;
  private manager: User;
  private trainer: User;

  constructor(app: INestApplication) {
    super(app);
    this.firebase = app.get(FirebaseService);
    this.common = app.get(CommonService);
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
    if ((await this.isInit()) || !this.common.env.isDev()) return;

    // create / update admin user
    this.admin = await this.authService.upsert({
      email: this.configService.getOrThrow('ADMIN_EMAIL'),
      password: this.configService.getOrThrow('ADMIN_PASSWORD'),
      displayName: 'Admin',
      role: UserRole.ADMIN,
    });

    this.manager = await this.authService.upsert({
      email: 'manager@mail.com',
      password: 'password',
      displayName: 'Manager',
      role: UserRole.MANAGER,
    });

    this.trainer = await this.authService.upsert({
      email: 'trainer@mail.com',
      password: 'password',
      displayName: 'Trainer',
      role: UserRole.TRAINER,
    });

    await this.clearData();

    try {
      await this.importUsers();
      await this.importExercises();

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
    await this.firebase.deleteCollection(FirestoreCollection.GROUP);
    await this.firebase.deleteCollection(FirestoreCollection.EXERCISE);
    await this.firebase.deleteCollection(FirestoreCollection.PROFILE);
    await this.firebase.deleteCollection(FirestoreCollection.TRAINING);
    await this.firebase.deleteCollection(FirestoreCollection.INSTITUTION);
  }

  private async importExercises() {
    const exerciseService = this.app.get(ExerciseService);
    const data: Update<Exercise>[] = [
      { name: 'Squats', components: ['strength:corrective:spine'] },
      { name: 'Deadlifts', components: ['strength:corrective:spine'] },
      { name: 'Bench Press', components: ['strength:corrective:spine'] },
      { name: 'High Plank Reach', components: ['strength:corrective:spine'] },
      { name: 'Power Clean', components: ['strength:corrective:spine'] },
      { name: 'Sprint', components: ['speed:cod'] },
      { name: 'Sleed Acceleration', components: ['speed:agility:hybrid'] },
      { name: 'Jogging', components: ['endurance:aerobic-capacity'] },
      {
        name: 'Bicep Stretching',
        components: ['rom:flexibility:passive-stretching'],
        isUnilateral: true,
      },
      {
        name: 'Bulgarian Split Squat',
        components: ['strength:corrective:spine'],
        isUnilateral: true,
      },
    ];

    await exerciseService.upsertMany(this.admin, data as CreateExerciseDto[]);
  }

  private async importUsers() {
    const userRepository = this.app.get(ProfileRepository);
    const groupService = this.app.get(GroupService);
    const institutionService = this.app.get(InstitutionService);

    const data = [
      {
        email: 'admin@mail.com',
        role: UserRole.ADMIN,
        level: 'beginner',
        displayName: 'Blindoff Admin',
        weight: 102.3,
        groups: [],
      },
      {
        email: 'manager@mail.com',
        role: UserRole.MANAGER,
        level: 'beginner',
        displayName: 'Manager',
        weight: 80.5,
        groups: [],
      },
      {
        email: 'trainer@mail.com',
        role: UserRole.TRAINER,
        level: 'beginner',
        displayName: 'Trainer',
        weight: 90.5,
        groups: [
          {
            name: 'Volleyball U23 Women',
            membersIds: ['the.rock@mail.com', 'bruce.lee@mail.com'],
          },
          {
            name: 'Football U19 Men',
            membersIds: [
              'john.doe@mail.com',
              'mike.tyson@mail.com',
              'bruce.lee@mail.com',
              'michael.jackson@mail.com',
              'tom.hanks@mail.com',
              'the.rock@mail.com',
            ],
          },
        ],
      },
      {
        email: 'john.doe@mail.com',
        role: UserRole.ATHLETE,
        level: 'beginner',
        displayName: 'John Doe',
        weight: 70.5,
        groups: [],
      },
      {
        email: 'mike.tyson@mail.com',
        role: UserRole.ATHLETE,
        level: 'beginner',
        displayName: 'Mike Tyson',
        weight: 93.5,
        groups: [],
      },
      {
        email: 'bruce.lee@mail.com',
        role: UserRole.ATHLETE,
        level: 'beginner',
        displayName: 'Bruce Lee',
        weight: 80,
        groups: [],
      },
      {
        email: 'the.rock@mail.com',
        role: UserRole.ATHLETE,
        level: 'beginner',
        displayName: 'Dwayne Johnson',
        weight: 120,
        groups: [],
      },
      {
        email: 'michael.jackson@mail.com',
        role: UserRole.ATHLETE,
        level: 'beginner',
        displayName: 'Michael Jackson',
        weight: 75,
        groups: [],
      },
      {
        email: 'tom.hanks@mail.com',
        role: UserRole.ATHLETE,
        level: 'beginner',
        displayName: 'Tom Hanks',
        weight: 85,
        groups: [],
      },
    ];

    const createdUsers: User[] = [];
    for (const userData of data) {
      createdUsers.push(
        await this.authService.upsert({
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
          uid: user.uid,
          email: user.email,
          height: 0,
          weight: 0,
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
      await institutionService.updateMember(
        this.admin,
        { institutionId: institution.id },
        { add: true, userId: user.uid, trainer: false },
      );

    // add trainer
    await institutionService.updateMember(
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
        trainerIds: [this.trainer.uid],
        membersIds,
        institutionId: institution.id,
      });

      groupIds.push(group.id);
    }
  }

  private async isInit() {
    const localDevCollection = this.firebase.firestore.collection(
      FirestoreCollection.META,
    );

    return (
      (await localDevCollection.doc('local-dev').get()).data()?.inserted ||
      false
    );
  }

  private async setInit() {
    const localDevCollection = this.firebase.firestore.collection(
      FirestoreCollection.META,
    );

    await localDevCollection.doc('local-dev').set({ inserted: true });
  }
}
