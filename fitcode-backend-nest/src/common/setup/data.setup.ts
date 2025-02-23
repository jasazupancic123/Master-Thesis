import { INestApplication } from '@nestjs/common';
import { addDays } from 'date-fns';
import { readFile } from 'node:fs/promises';
import { ComponentService } from 'src/component/component.service';
import { Component } from 'src/component/entity/component.entity';
import { Exercise } from 'src/exercise/entity/exercise.entity';
import { ExerciseAttributeService } from 'src/exercise/service/exercise-attribute.service';
import { ExerciseService } from 'src/exercise/service/exercise.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { Group } from 'src/group/entity/group.entity';
import { GroupService } from 'src/group/group.service';
import { TrainingService } from 'src/training/service/training.service';
import { UserEntity } from 'src/user/entity/user.entity';
import { SportLevel } from 'src/user/enum/sport-level.enum';
import { UserRole } from 'src/user/enum/user-role.enum';
import { UserRepository } from 'src/user/repository/user.repository';
import { UserService } from 'src/user/user.service';
import { FirestoreCollection } from '../enum/firestore-collection.enum';
import { User } from '../type/firebase-auth.type';
import { DatabaseSchema } from '../type/firestore.type';
import { BaseSetup } from './base.setup';

export class DataSetup extends BaseSetup {
  private readonly firebaseService: FirebaseService;
  private readonly userService: UserService;
  private readonly componentService: ComponentService;
  private readonly exerciseAttributeService: ExerciseAttributeService;
  private readonly exerciseService: ExerciseService;
  private readonly groupService: GroupService;
  private readonly trainingService: TrainingService;

  constructor(app: INestApplication) {
    super(app);

    this.firebaseService = app.get(FirebaseService);
    this.userService = app.get(UserService);
    this.componentService = app.get(ComponentService);
    this.exerciseAttributeService = app.get(ExerciseAttributeService);
    this.exerciseService = app.get(ExerciseService);
    this.groupService = app.get(GroupService);
    this.trainingService = app.get(TrainingService);
  }

  /**
   * A special collection for local dev is used to check if data has been
   * inserted or not. If the flag is `false`, data is imported and flag
   * set to `true`, else if the flag is `true`, nothing gets imported.
   */
  async setup() {
    const time = performance.now();

    const localDevCollection = this.firebaseService.firestore.collection(
      FirestoreCollection.LOCAL_DEV,
    );

    const inserted =
      (await localDevCollection.get()).docs?.[0]?.data()?.inserted || false;

    if (inserted) return;

    // create / update admin user
    await this.userService.upsert({
      email: this.configService.getOrThrow('FIREBASE_ADMIN_EMAIL'),
      password: this.configService.getOrThrow('FIREBASE_ADMIN_PASSWORD'),
      displayName: 'Admin',
      customClaims: { role: [UserRole.ADMIN] },
    });

    // delete all data
    await this.firebaseService.deleteCollection(FirestoreCollection.GROUP);
    await this.firebaseService.deleteCollection(FirestoreCollection.EXERCISE);
    await this.firebaseService.deleteCollection(
      FirestoreCollection.EXERCISE_ATTRIBUTE,
    );

    await this.firebaseService.deleteCollection(FirestoreCollection.COMPONENT);

    const foundUsers = await this.userService.findAll();
    for (const user of foundUsers) {
      await this.firebaseService.deleteCollection(
        `${FirestoreCollection.USER}/${user.uid}/${FirestoreCollection.USER_META}`,
      );
    }

    try {
      await this.import('data.json');
      this.logger.debug(
        `Data setup took ${(performance.now() - time) / 1000}s`,
      );
    } catch (e) {
      this.logger.error('Failed to import data');
      console.error(e);
    }

    await localDevCollection.add({ inserted: true });
  }

  private async import(filename: string) {
    const file = await readFile(filename, 'utf-8');
    const data: DatabaseSchema = JSON.parse(file);

    // import components
    const components = (data[FirestoreCollection.COMPONENT] ||
      []) as unknown as (Omit<Component, 'children'> & {
      children: Component[];
    })[];

    await Promise.all(
      components.map((component) =>
        this.componentService.createFromTree(component),
      ),
    );

    this.logger.debug(`Successfully imported ${components.length} components`);

    // import exercise attributes
    const exerciseAttributes =
      data[FirestoreCollection.EXERCISE_ATTRIBUTE] || [];

    await Promise.all(
      exerciseAttributes.map((attribute) =>
        this.exerciseAttributeService.create(attribute),
      ),
    );

    this.logger.debug(
      `Successfully imported ${exerciseAttributes.length} exercise attributes`,
    );

    // import users
    const usersData =
      (data[FirestoreCollection.USER] as (UserEntity &
        Record<string, any>)[]) || [];

    let createdUsers: User[] = [];
    for (const userData of usersData) {
      const upserted = await this.userService.upsert({
        email: userData.email,
        displayName: userData.displayName,
        password: 'password',
        customClaims: { role: [userData.role || UserRole.ATHLETE] },
      });

      // set user custom claims to avoid waiting for function to be triggered
      await this.firebaseService.auth.setCustomUserClaims(upserted.uid, {
        role: [userData?.role || UserRole.ATHLETE],
      });

      createdUsers.push(upserted);
    }

    // set `users` collection data to avoid waiting for function to be triggered
    const userRepository = this.app.get(UserRepository);

    await Promise.all(
      createdUsers.map((user) => {
        const userData = usersData.find((u) => u.email === user.email);
        userRepository.addDoc({
          id: user.uid,
          level: userData?.level || SportLevel.BEGINNER,
        });

        this.userService.addOrUpdateMeta(
          { uid: user.uid, date: new Date() },
          {
            userId: user.uid,
            date: new Date(),
            weight: userData.weight,
            sleep: 5,
            fatigue: 5,
            soreness: 5,
            comment: 'Average day today',
          },
        );
      }),
    );

    this.logger.debug(`Successfully imported ${usersData.length} users`);
    const users = await this.userService.findAll({
      emails: usersData.map((user) => user.email),
    });

    for (const user of users) {
      const ref = { uid: user.uid };

      // import exercises
      const exercises =
        (usersData.find((u) => u.email === user.email)?.exercises as (Exercise &
          Record<string, any>)[]) || [];

      for (const exercise of exercises) {
        const component = await this.componentService.findOneBySlug(
          exercise.component,
        );

        if (!component) {
          this.logger.error(
            `Component with slug ${exercise.component} not found`,
          );

          continue;
        }

        await this.exerciseService.create(user, {
          name: exercise.name,
          componentsIds: [component.id],
          attributeValues: exercise.attributes,
        });
      }

      // import groups
      // NOTE - cycle will last 10 days by default and subgroup 1 day
      const groups =
        (usersData.find((u) => u.email === user.email)?.groups as (Group &
          Record<string, any>)[]) || [];

      for (const { name, membersEmails: emails } of groups) {
        const members = await this.userService.findAll({ emails });
        const membersIds = members.map((m) => m.uid);
        const group = await this.groupService.create(user, {
          name,
          membersIds,
        });

        // import cycles
        let from = new Date();
        let to = addDays(from, 10);

        const groupRef = { ...ref, groupId: group.id };
        /*for (const { name, description } of cycles) {
          const cycle = await this.groupService.addCycle(groupRef, {
            name,
            description,
            from,
            to,
          });

          // import trainings
          const cycleRef = { ...groupRef, cycleId: cycle.id };
          for (const { components } of trainings) {
            for (const {
              component: slug,
              supersets,
            } of components as (TrainingComponent & Record<string, any>)[]) {
              const component = await this.componentService.findOneBySlug(
                slug as unknown as string,
              );

              if (!component) {
                this.logger.error(`Component with slug ${slug} not found`);
                continue;
              }

              const trainingFrom = addDays(from, 1);
              const trainingTo = addHours(trainingFrom, 3);
              const training = await this.trainingService.create(cycleRef, {
                componentIds: [component.id],
                from: trainingFrom,
                to: trainingTo,
              });

              from = addDays(from, 1);

              // import training exercises
              const trainingRef = { ...cycleRef, trainingId: training.id };
              const componentRef = {
                ...trainingRef,
                componentId: component.id,
                subgroupId: null,
              };

              for (const { exercises } of supersets) {
                const superset = await this.trainingService.addSuperset(
                  componentRef,
                  {},
                );

                for (const { exercise: name, meta } of exercises) {
                  const exercise = await this.exerciseService.findOneByName(
                    name as unknown as string,
                  );

                  if (!exercise) {
                    this.logger.error(`Exercise with name ${name} not found`);
                    continue;
                  }

                  const exerciseRef = {
                    ...cycleRef,
                    trainingId: training.id,
                    componentId: component.id,
                    supersetId: superset.id,
                    subgroupId: null,
                  };

                  await this.trainingService.addExercises(exerciseRef, [
                    {
                      meta,
                      exerciseId: exercise.id,
                    },
                  ]);
                }
              }
            }
          }

          from = addDays(to, 1);
          to = addDays(from, 10);
        }*/
      }
    }
  }
}
