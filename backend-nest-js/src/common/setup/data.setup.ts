import { BaseSetup } from './base.setup';
import { INestApplication } from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { SportLevel } from '../../user/enum/sport-level.enum';
import { UserRole } from '../../user/enum/user-role.enum';
import { ComponentService } from '../../component/component.service';
import { readFile } from 'node:fs/promises';
import { Component } from '../../component/entity/component.entity';
import { ExerciseAttribute } from '../../exercise/entity/exercise-attribute.entity';
import { ExerciseService } from '../../exercise/exercise.service';
import { User } from '../type/custom-claims.type';
import { CreateExerciseDto } from '../../exercise/dto/create-exercise.dto';
import { GroupService } from '../../group/group.service';
import { SetType } from '../../exercise-info/enum/set-type.enum';
import { WorkloadType } from '../../exercise-info/enum/workload-type.enum';
import { Effort } from '../../exercise-info/enum/effort.enum';
import { CycleService } from '../../cycle/cycle.service';
import { TrainingService } from '../../training/training.service';
import { SetService } from '../../set/set.service';
import { addDays, addHours } from 'date-fns';
import { FirebaseService } from '../../firebase/firebase.service';
import { FirestoreCollection } from '../enum/firestore-collection.enum';

interface Data {
  users: boolean;
  components: boolean;
  exercises: boolean;
  exerciseAttributes: boolean;
  groups: boolean;
}

interface Options {
  importOnStartup: Partial<Data>;
  refreshOnImport: Partial<Data>;
}

export class DataSetup extends BaseSetup<Options> {
  private readonly firebaseService: FirebaseService;
  private readonly userService: UserService;
  private readonly componentService: ComponentService;
  private readonly exerciseService: ExerciseService;
  private readonly groupService: GroupService;
  private readonly cycleService: CycleService;
  private readonly trainingService: TrainingService;
  private readonly setService: SetService;
  private admin: User;

  constructor(app: INestApplication) {
    super(app);

    this.firebaseService = app.get(FirebaseService);
    this.userService = app.get(UserService);
    this.componentService = app.get(ComponentService);
    this.exerciseService = app.get(ExerciseService);
    this.groupService = app.get(GroupService);
    this.cycleService = app.get(CycleService);
    this.trainingService = app.get(TrainingService);
    this.setService = app.get(SetService);
  }

  async setup(options: Options) {
    const time = performance.now();

    // create / update admin user
    this.admin = await this.userService.upsert({
      email: this.configService.getOrThrow('FIREBASE_ADMIN_EMAIL'),
      password: this.configService.getOrThrow('FIREBASE_ADMIN_PASSWORD'),
      displayName: 'Admin',
      customClaims: { role: [UserRole.ADMIN], level: SportLevel.ADVANCED },
    });

    if (options.importOnStartup) {
      const collections = {
        components: this.firebaseService.firestore.collection(FirestoreCollection.COMPONENT),
        exercise: this.firebaseService.firestore.collection(FirestoreCollection.EXERCISE),
        group: this.firebaseService.firestore.collection(FirestoreCollection.GROUP),
        exerciseAttributeValue: this.firebaseService.firestore.collection(FirestoreCollection.EXERCISE_ATTRIBUTE_VALUE),
        exerciseAttribute: this.firebaseService.firestore.collection(FirestoreCollection.EXERCISE_ATTRIBUTE),
        cycle: this.firebaseService.firestore.collection(FirestoreCollection.CYCLE),
        training: this.firebaseService.firestore.collection(FirestoreCollection.TRAINING),
        setGroup: this.firebaseService.firestore.collection(FirestoreCollection.SET_GROUP),
        setSubgroup: this.firebaseService.firestore.collection(FirestoreCollection.SET_SUB_GROUP),
        setExercise: this.firebaseService.firestore.collection(FirestoreCollection.SET_EXERCISE),
        superExerciseInfo: this.firebaseService.firestore.collection(FirestoreCollection.SUPER_EXERCISE_INFO),
        exerciseInfo: this.firebaseService.firestore.collection(FirestoreCollection.EXERCISE_INFO),
      };

      if (options.importOnStartup.users) {
        if (options.refreshOnImport.users) {
          // delete all users
          const users = await this.userService.findAll(this.admin);
          for (const user of users) await this.firebaseService.auth.deleteUser(user.uid);
        }

        // import users
        await this.importUsers('data/users.json');
      }

      if (options.importOnStartup.components) {
        if (options.refreshOnImport.components) {
          // delete all components
          const components = await collections.components.get();
          for (const component of components.docs) await component.ref.delete();
        }

        // import components
        await this.importComponents('data/components.json');
      }

      if (options.importOnStartup.exerciseAttributes) {
        if (options.refreshOnImport.exerciseAttributes) {
          // delete all exercise attributes
          const attributes = await collections.exerciseAttribute.get();
          for (const attribute of attributes.docs) await attribute.ref.delete();

          // delete all exercise attribute values
          const attributeValues = await collections.exerciseAttributeValue.get();
          for (const doc of attributeValues.docs) await doc.ref.delete();
        }

        // import exercise attributes
        await this.importExerciseAttributes('data/exercise-attributes.json');
      }

      if (options.importOnStartup.exercises) {
        if (options.refreshOnImport.exercises) {
          // delete all exercises
          const exercises = await collections.exercise.get();
          for (const exercise of exercises.docs) await exercise.ref.delete();
        }

        // import exercises
        await this.importExercises('data/exercises.json');
      }

      if (options.importOnStartup.groups) {
        if (options.refreshOnImport.groups) {
          // delete groups, cycles, trainings, set groups, set subgroups, set exercises, super exercise info and exercise info
          const groups = await collections.group.get();
          for (const group of groups.docs) await group.ref.delete();

          const cycles = await collections.cycle.get();
          for (const cycle of cycles.docs) await cycle.ref.delete();

          const trainings = await collections.training.get();
          for (const training of trainings.docs) await training.ref.delete();

          const setGroups = await collections.setGroup.get();
          for (const setGroup of setGroups.docs) await setGroup.ref.delete();

          const setSubgroups = await collections.setSubgroup.get();
          for (const setSubgroup of setSubgroups.docs) await setSubgroup.ref.delete();

          const setExercises = await collections.setExercise.get();
          for (const setExercise of setExercises.docs) await setExercise.ref.delete();

          const superExerciseInfo = await collections.superExerciseInfo.get();
          for (const info of superExerciseInfo.docs) await info.ref.delete();

          const exerciseInfo = await collections.exerciseInfo.get();
          for (const info of exerciseInfo.docs) await info.ref.delete();
        }

        await this.importGroups('data/groups.json');
      }
    }

    this.logger.debug(`Data setup took ${(performance.now() - time) / 1000}s`);
  }

  private async importUsers(filename: string) {
    try {
      const file = await readFile(filename, 'utf-8');
      const data: { email: string; role: UserRole; displayName: string; }[] = JSON.parse(file);

      for (const user of data) {
        await this.userService.upsert({
          email: user.email,
          password: 'password',
          displayName: user.displayName,
          customClaims: { role: [user.role], level: SportLevel.ADVANCED },
        });
      }

      this.logger.debug('Successfully imported users');
    } catch (e) {
      this.logger.error('Failed to import users');
      this.logger.error(e);
    }
  }

  private async importComponents(filename: string) {
    const components = await this.componentService.findAll();
    if (components.length) {
      this.logger.debug('Components already exist, skipping import');
      return;
    }

    try {
      const file = await readFile(filename, 'utf-8');
      const data: Component[] = JSON.parse(file);
      await this.componentService.createMany(data);
      this.logger.debug('Successfully imported components');
    } catch (e) {
      this.logger.error('Failed to import components');
      this.logger.error(e);
    }
  }

  private async importExerciseAttributes(filename: string) {
    const attributes = await this.exerciseService.exerciseAttributeRepository.findAll();
    if (attributes.length) {
      this.logger.debug('Exercise attributes already exist, skipping import');
      return;
    }

    try {
      const file = await readFile(filename, 'utf-8');
      const data: ExerciseAttribute[] = JSON.parse(file);

      for (const attribute of data)
        await this.exerciseService.exerciseAttributeRepository.create({
          name: attribute.name,
          field: attribute.field,
          required: attribute.required ?? false,
          type: attribute.type ?? 'string',
          values: attribute.values,
        });

      this.logger.debug('Successfully imported exercise attributes');
    } catch (e) {
      this.logger.error('Failed to import exercise attributes');
      this.logger.error(e);
    }
  }

  private async importExercises(filename: string) {
    const exercises = await this.exerciseService.findAll(this.admin);
    if (exercises.length) {
      this.logger.debug('Exercises already exist, skipping import');
      return;
    }

    try {
      const file = await readFile(filename, 'utf-8');
      const data: {
        name: string,
        component: string,
        attributes: Record<string, any>
      }[] = JSON.parse(file);

      for (const exercise of data) {
        const component = await this.componentService.findOneBySlug(exercise.component);
        if (!component) {
          this.logger.error(`Component with slug ${exercise.component} not found`);
          continue;
        }

        await this.exerciseService.create(this.admin, {
          name: exercise.name,
          componentIds: [component.id],
          attributeValues: exercise.attributes,
        } as CreateExerciseDto);
      }

      this.logger.debug('Successfully imported exercises');
    } catch (e) {
      this.logger.error('Failed to import exercises');
      this.logger.error(e.message, e.stack);
    }
  }

  private async importGroups(filename: string) {
    try {
      const file = await readFile(filename, 'utf-8');
      const data: {
        name: string,
        user: string,
        members: string[],
        cycles: {
          name: string,
          description: string,
          durationInWeeks: number,
          trainings: {
            component: string,
            order: number,
            setSubgroups: {
              color: string,
              order: number,
              setExercises: {
                exercise: string,
                order: number,
                superExerciseInfo: {
                  sets: number,
                  setType: SetType,
                  setTypeValue: number,
                  workloadType: WorkloadType,
                  workloadTypeValue: number,
                  effort: Effort,
                  rec: number,
                }
              }[]
            }[]
          }[]
        }[]
      }[] = JSON.parse(file);

      for (const { name, user, members, cycles } of data) {
        const trainer = await this.userService.findOneByEmail(user);
        const exercises = await this.exerciseService.findAll(trainer);
        const groups = await this.groupService.findAll(trainer);
        if (groups.some(g => g.name === name)) {
          this.logger.debug(`Trainer ${trainer.email} already has groups`);
          continue;
        }

        const memberIds = await Promise.all(members.map(async email => {
          const member = await this.userService.findOneByEmail(email);
          return member.uid;
        }));

        const group = await this.groupService.create(trainer, { name, membersIds: memberIds });

        // create cycles
        let startDate = new Date();
        for (const { name, description, durationInWeeks = 1, trainings } of cycles) {
          const cycle = await this.cycleService.create(trainer, {
            groupId: group.id,
            name,
            description,
            startDate,
            endDate: addDays(startDate, durationInWeeks * 7),
          });

          // create trainings
          let startTime = startDate;
          for (const { component: componentSlug, setSubgroups } of trainings) {
            const component = await this.componentService.findOneBySlug(componentSlug);
            if (!component) {
              this.logger.error(`Component with slug ${componentSlug} not found, skipping training`);
              continue;
            }

            const training = await this.trainingService.create(trainer, {
              componentIds: [component.id],
              cycleId: cycle.id,
              startTime: addHours(startTime, 1),
              endTime: addHours(startTime, 3),
            });

            // create set subgroup
            const setGroups = await this.setService.initializeTraining(training.id, [component.id]);

            // create set exercises
            for (const { setExercises } of setSubgroups) {
              for (const { exercise: exerciseName, superExerciseInfo } of setExercises) {
                const exercise = exercises.find(e => e.name === exerciseName);
                if (!exercise) {
                  this.logger.error(`Exercise with name ${exerciseName} not found, skipping set exercise`);
                  continue;
                }

                await this.setService.addExercisesToSetGroup(
                  trainer,
                  setGroups[0].setSubgroups[0].id,
                  [exercise.id],
                  superExerciseInfo,
                );
              }
            }

            startTime = addDays(startTime, 2);
          }

          startDate = addDays(startDate, durationInWeeks * 7 + 1);
        }
      }

      this.logger.debug('Successfully imported groups');
    } catch (e) {
      this.logger.error('Failed to import groups');
      this.logger.error(e);
    }
  }
}