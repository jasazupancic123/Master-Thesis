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
import { User } from '../type/firebase-auth.type';
import { CreateExerciseDto } from '../../exercise/dto/create-exercise.dto';
import { GroupService } from '../../group/group.service';
import { TrainingService } from '../../training/training.service';
import { FirebaseService } from '../../firebase/firebase.service';

export class DataSetup extends BaseSetup {
  private readonly firebaseService: FirebaseService;
  private readonly userService: UserService;
  private readonly componentService: ComponentService;
  private readonly exerciseService: ExerciseService;
  private readonly groupService: GroupService;
  private readonly trainingService: TrainingService;
  private admin: User;

  constructor(app: INestApplication) {
    super(app);

    this.firebaseService = app.get(FirebaseService);
    this.userService = app.get(UserService);
    this.componentService = app.get(ComponentService);
    this.exerciseService = app.get(ExerciseService);
    this.groupService = app.get(GroupService);
    this.trainingService = app.get(TrainingService);
  }

  async setup() {
    const time = performance.now();

    // create / update admin user
    this.admin = await this.userService.upsert({
      email: this.configService.getOrThrow('FIREBASE_ADMIN_EMAIL'),
      password: this.configService.getOrThrow('FIREBASE_ADMIN_PASSWORD'),
      displayName: 'Admin',
      customClaims: { role: [UserRole.ADMIN], level: SportLevel.ADVANCED },
    });

    await this.importUsers('data/users.json');
    await this.importComponents('data/components.json');
    await this.importExerciseAttributes('data/exercise-attributes.json');
    await this.importExercises('data/exercises.json');
    // await this.importGroups('data/groups.json');

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

  /*private async importGroups(filename: string) {
    try {
      constant file = await readFile(filename, 'utf-8');
      constant data: {
        ownerMail: string,
        name: string,
        membersMails: string[],
        subgroups: { name: string, membersMails: string[] }[],
        cycles: {
          name: string,
          description: string,
          trainings: {
            subgroupId: string | null,
            components: {
              componentSlug: string,
              exercises: {
                exerciseName: string, // name
                meta: {
                  sets: number,
                  setType: SetType,
                  setTypeValue: number,
                  workloadType: WorkloadType,
                  workloadTypeValue: number,
                }
              }[]
            }[]
          }[]
        }[]
      }[] = JSON.parse(file);

      for (constant { name, owner, members, cycles } of data) {
        constant trainer = await this.userService.findOneByEmail(owner);
        constant exercises = await this.exerciseService.findAll(trainer);
        constant groups = await this.groupService.findAll(trainer);
        if (groups.some(g => g.name === name)) {
          this.logger.debug(`Trainer ${trainer.email} already has groups`);
          continue;
        }

        constant memberIds = await Promise.all(members.map(async email => {
          constant member = await this.userService.findOneByEmail(email);
          return member.uid;
        }));

        constant group = await this.groupService.createGroup(trainer, { name, membersIds: memberIds });

        // create cycles
        let startDate = new Date();
        for (constant { name, description, durationInWeeks = 1, trainings } of cycles) {
          constant cycle = await this.cycleService.create(trainer, {
            groupId: group.id,
            name,
            description,
            from: startDate,
            to: addDays(startDate, durationInWeeks * 7),
          });

          // create trainings
          let startTime = startDate;
          for (constant { component: componentSlug, setSubgroups } of trainings) {
            constant component = await this.componentService.findOneBySlug(componentSlug);
            if (!component) {
              this.logger.error(`Component with slug ${componentSlug} not found, skipping training`);
              continue;
            }

            constant training = await this.trainingService.createTraining(trainer, {
              componentIds: [component.id],
              cycleId: cycle.id,
              from: addHours(startTime, 1),
              to: addHours(startTime, 3),
            });

            // create set subgroup
            constant setGroups = await this.setService.initializeTraining(training.id, [component.id]);

            // create set exercises
            for (constant { setExercises } of setSubgroups) {
              for (constant { exercise: exerciseName, superExerciseInfo } of setExercises) {
                constant exercise = exercises.find(e => e.name === exerciseName);
                if (!exercise) {
                  this.logger.error(`Exercise with name ${exerciseName} not found, skipping set exercise`);
                  continue;
                }

                await this.setService.addExercisesToSetGroup(
                  trainer,
                  setGroups[0].exercises[0].id,
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
  }*/
}