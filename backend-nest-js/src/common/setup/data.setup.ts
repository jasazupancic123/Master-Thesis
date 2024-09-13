import { BaseSetup } from './base.setup';
import { INestApplication } from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { SportLevel } from '../../user/enum/sport-level.enum';
import { UserRole } from '../../user/enum/user-role.enum';
import { ComponentService } from '../../component/component.service';
import { readFile } from 'node:fs/promises';
import { ExerciseService } from '../../exercise/service/exercise.service';
import { GroupService } from '../../group/service/group.service';
import { TrainingService } from '../../training/service/training.service';
import { DatabaseSchema } from '../type/firebase-firestore.type';
import { ExerciseAttributeService } from '../../exercise/service/exercise-attribute.service';
import { FirestoreCollection } from '../enum/firestore-collection.enum';
import { Exercise } from '../../exercise/entity/exercise.entity';
import { UserEntity } from '../../user/entity/user.entity';
import { Group } from '../../group/entity/group.entity';
import { addDays, addHours } from 'date-fns';
import { TrainingComponent } from '../../training/entity/training-component.entity';
import { FirebaseService } from '../../firebase/firebase.service';
import { Component } from '../../component/entity/component.entity';
import { UserRepository } from '../../user/repository/user.repository';

export class DataSetup extends BaseSetup<{ dev: boolean }> {
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

  async setup(options: { dev: boolean }) {
    const time = performance.now();

    // create / update admin user
    await this.userService.upsert({
      email: this.configService.getOrThrow('FIREBASE_ADMIN_EMAIL'),
      password: this.configService.getOrThrow('FIREBASE_ADMIN_PASSWORD'),
      displayName: 'Admin',
      customClaims: { role: [UserRole.ADMIN] },
    });

    if (options?.dev) {
      // delete all data
      const foundUsers = await this.userService.findAll();
      for (const user of foundUsers) {
        await this.firebaseService.deleteCollection(
          `${FirestoreCollection.USER}/${user.uid}/${FirestoreCollection.GROUP}`,
        );

        await this.firebaseService.deleteCollection(
          `${FirestoreCollection.USER}/${user.uid}/${FirestoreCollection.WELLNESS}`,
        );
      }

      await this.firebaseService.deleteCollection(FirestoreCollection.EXERCISE);
      await this.firebaseService.deleteCollection(
        FirestoreCollection.COMPONENT,
      );

      await this.firebaseService.deleteCollection(
        FirestoreCollection.EXERCISE_ATTRIBUTE,
      );

      try {
        await this.import('data.json');
        this.logger.debug(
          `Data setup took ${(performance.now() - time) / 1000}s`,
        );
      } catch (e) {
        this.logger.error('Failed to import data');
        console.error(e);
      }
    }
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

    const createdUsers = await Promise.all(
      usersData.map((user) =>
        this.userService.upsert({
          email: user.email,
          displayName: user.displayName,
          customClaims: { role: [user.role], level: SportLevel.ADVANCED },
          password: 'password',
        }),
      ),
    );

    // set user custom claims to avoid waiting for function to be triggered
    await Promise.all(
      createdUsers.map((user) => {
        const userData = usersData.find((u) => u.email === user.email);
        this.firebaseService.auth.setCustomUserClaims(user.uid, {
          role: [userData?.role || UserRole.ATHLETE],
        });
      }),
    );

    // set `users` collection data to avoid waiting for function to be triggered
    const userRepository = this.app.get(UserRepository);
    await Promise.all(
      createdUsers.map((user) => {
        const userData = usersData.find((u) => u.email === user.email);
        userRepository.addDoc({
          id: user.uid,
          level: userData?.level || SportLevel.BEGINNER,
          bodyweight: [
            {
              weight: userData?.weight,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        });
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

        await this.exerciseService.createExercise(user, ref, {
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
      for (const { name, membersEmails: emails, cycles } of groups) {
        const members = await this.userService.findAll({ emails });
        const membersIds = members.map((m) => m.uid);
        const group = await this.groupService.createGroup(user, ref, {
          ownerId: user.uid,
          name,
          membersIds,
        });

        // import cycles
        let from = new Date();
        let to = addDays(from, 10);

        const groupRef = { ...ref, groupId: group.id };
        for (const { name, description, trainings } of cycles) {
          const cycle = await this.groupService.addCycle(user, groupRef, {
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
              const training = await this.trainingService.createTraining(
                user,
                cycleRef,
                {
                  componentIds: [component.id],
                  from: trainingFrom,
                  to: trainingTo,
                },
              );

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
                  user,
                  componentRef,
                  {},
                );

                for (const { exercise: name, meta } of exercises) {
                  const exercise =
                    await this.exerciseService.findExerciseByName(
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

                  await this.trainingService.addExercise(user, exerciseRef, {
                    meta,
                    exerciseId: exercise.id,
                  });
                }
              }
            }
          }

          from = addDays(to, 1);
          to = addDays(from, 10);
        }
      }
    }
  }
}
