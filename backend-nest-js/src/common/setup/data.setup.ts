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

export class DataSetup extends BaseSetup<{ importDevData: boolean }> {
  private userService: UserService;
  private componentService: ComponentService;
  private exerciseService: ExerciseService;

  constructor(app: INestApplication) {
    super(app);

    this.userService = app.get(UserService);
    this.componentService = app.get(ComponentService);
    this.exerciseService = app.get(ExerciseService);
  }

  async setup(options: { importDevData: boolean }) {
    // create / update admin user
    const admin = await this.userService.upsert({
      email: this.configService.get('FIREBASE_ADMIN_EMAIL'),
      password: this.configService.get('FIREBASE_ADMIN_PASSWORD'),
      displayName: 'Admin',
      customClaims: { role: [UserRole.ADMIN], level: SportLevel.ADVANCED },
    });

    if (options.importDevData) {
      // import users
      await this.importUsers('data/users.json');
      this.logger.debug('Successfully imported users');

      // import components if they do not exist
      const components = await this.componentService.findAll();
      if (!components.length) {
        await this.importComponents('data/components.json');
        this.logger.debug('Successfully imported components');
      } else
        this.logger.debug('Components already exist, skipping import');

      // import exercise attributes if they do not exist
      const attributes = await this.exerciseService.exerciseAttributeRepository.findAll();
      if (!attributes.length) {
        await this.importExerciseAttributes('data/exercise-attributes.json');
        this.logger.debug('Successfully imported exercise attributes');
      } else
        this.logger.debug('Exercise attributes already exist, skipping import');

      // import exercises
      const exercises = await this.exerciseService.findAll(admin);
      if (!exercises.length) {
        await this.importExercises('data/exercises.json', admin);
        this.logger.debug('Successfully imported exercises');
      } else
        this.logger.debug('Exercises already exist, skipping import');
    }
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
    } catch (e) {
      this.logger.error('Failed to import users');
      this.logger.error(e);
    }
  }

  private async importComponents(filename: string) {
    try {
      const file = await readFile(filename, 'utf-8');
      const data: Component[] = JSON.parse(file);
      await this.componentService.createMany(data);
    } catch (e) {
      this.logger.error('Failed to import components');
      this.logger.error(e);
    }
  }

  private async importExerciseAttributes(filename: string) {
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
    } catch (e) {
      this.logger.error('Failed to import exercise attributes');
      this.logger.error(e);
    }
  }

  private async importExercises(filename: string, admin: User) {
    try {
      const file = await readFile(filename, 'utf-8');
      const data: { name: string, component: string, attributes: Record<string, any> }[] = JSON.parse(file);

      for (const exercise of data) {
        const component = await this.componentService.findOneBySlug(exercise.component);
        if (!component) {
          this.logger.error(`Component with slug ${exercise.component} not found`);
          continue;
        }

        await this.exerciseService.create(admin, {
          name: exercise.name,
          componentIds: [component.id],
          attributeValues: exercise.attributes,
        } as CreateExerciseDto);
      }
    } catch (e) {
      this.logger.error('Failed to import exercises');
      this.logger.error(e.message, e.stack);
    }
  }
}