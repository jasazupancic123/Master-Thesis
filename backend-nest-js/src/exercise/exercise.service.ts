import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Exercise } from './entity/exercise.entity';
import { FirebaseService } from '../firebase/firebase.service';
import { ComponentService } from '../component/component.service';
import { Component } from '../component/entity/component.entity';
import { User } from '../common/type/firebase-auth.type';
import { InjectRepository } from '../common/decorator/entity.decorator';
import { FirestoreRepository } from '../firebase/firestore.repository';
import { ExerciseAttribute, ExerciseAttributeSelectOption } from './entity/exercise-attribute.entity';
import { ExerciseAttributeValue } from './entity/exercise-attribute-value.entity';
import { CommonService } from '../common/service/common.service';
import { Filter, FindManyOptions } from '../common/type/orm.type';
import { UserRole } from '../user/enum/user-role.enum';
import { Validate } from '../common/type/validate.type';
import { FieldPath, Query } from 'firebase-admin/firestore';

type ComponentLeaf = Component & { parents: Component[] }

@Injectable()
export class ExerciseService {
  private logger = new Logger(ExerciseService.name);

  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    @InjectRepository(Exercise)
    private readonly repository: FirestoreRepository<Exercise>,
    @InjectRepository(ExerciseAttribute)
    readonly exerciseAttributeRepository: FirestoreRepository<ExerciseAttribute>,
    @InjectRepository(ExerciseAttributeValue)
    private readonly exerciseAttributeValueRepository: FirestoreRepository<ExerciseAttributeValue>,
    private readonly componentService: ComponentService,
  ) {
  }

  async canView(user: User, exercise: Exercise) {
    switch (user.customClaims?.role?.[0] ?? user['role']?.[0]) {
      case UserRole.ADMIN:
        // can view all exercises
        return true;
      case UserRole.MANAGER:
        // can view all global exercises, his exercises and exercises from all trainers under him
        // TODO
        return exercise.global || this.isOwner(user, exercise);
      case UserRole.TRAINER:
        // can view all global exercises, his exercises and exercises from his managers
        // TODO
        return exercise.global || this.isOwner(user, exercise);
      case UserRole.ATHLETE:
        // TODO
        // can view all global exercises, his exercises and exercises from his trainers
        return exercise.global || this.isOwner(user, exercise);
      default:
        return false;
    }
  }

  isOwner(user: User, exercise: Exercise) {
    return exercise.userId === user.uid;
  }

  async create(user: User, data: Partial<Exercise>) {
    this.logger.debug(`Creating new exercise for user ${user.uid}`);

    // validate data
    const { error, message, data: { leafs } = {} } = await this._validate(data);
    if (error) throw new BadRequestException(message);

    // find all root components of selected leaf components
    const roots: Component[] = [];
    for (const componentId of data.componentIds)
      roots.push(...this.componentService.getRootComponents(componentId, leafs));

    const exercise = await this.repository.create({
      userId: user.uid,
      global: this.firebaseService.isAdmin(user), // if user is admin, exercise is global
      name: data.name,
      componentIds: data.componentIds,
      videoUrl: data.videoUrl,
      imageUrl: data.imageUrl,
    });

    // create attribute values from provided nested object
    await this.createAttributeValues(exercise.id, data.attributeValues || {});

    return {
      id: exercise.id,
      rootComponentIds: roots.map(({ id }) => id), // used for frontend
    };
  }

  async getPageMeta(user: User, filter: Filter<Exercise>, pageSize: number): Promise<{
    total: number;
    pages: number
  }> {
    const exercises = await this.findAll(user, { filter });
    return { total: exercises.length, pages: Math.ceil(exercises.length / pageSize) };
  }

  async findAll(user: User, options: FindManyOptions<Exercise> = {}): Promise<Exercise[]> {
    let exercises: Exercise[];

    // filter exercises by ids if provided (name and attribute values cannot be
    // filtered by firestore, so they are filtered in memory)
    if (options.filter) {
      let query = this.repository.getCollection() as Query;

      if (options.filter?.ids)
        query = query.where(FieldPath.documentId(), 'in', options.filter.ids);

      exercises = (await query.get()).docs.map(doc => this.repository.serialize(doc));
    } else
      exercises = await this.repository.findAll();

    // filter by name, attribute values and components in memory
    const components = await this.componentService.findAll();
    const tree = this.componentService.tree(components);
    const leafs = this.componentService.leafs(tree);

    if (options.filter) {
      const { name, componentIds } = options.filter;
      if (name) exercises = exercises.filter(exercise => exercise.name.toLowerCase().includes(name.value.toLowerCase()));
      if (componentIds) exercises = this.filterByComponents(exercises, componentIds.value, leafs);
      // TODO - attribute value filtering
    }

    // pagination must be done in memory
    if (options.paginate)
      exercises = this.commonService.generic.paginate(exercises, options.paginate);

    return this.map(exercises, { components: leafs });
  }

  async findAllOrFail(user: User, options?: FindManyOptions<Exercise>): Promise<Exercise[]> {
    const { filter, paginate, populate } = options || {};
    const { ids } = filter || {};

    const exercises = await this.findAll(user, options);
    if (exercises.length < 1 || (ids && ids.length !== exercises.length))
      throw new BadRequestException('Invalid exercises provided');

    return exercises;
  }

  async findOneById(user: User, exerciseId: string): Promise<Exercise> {
    const exercise = await this.repository.findOneById(exerciseId);
    if (!exercise) return null;

    const canView = await this.canView(user, exercise);
    if (!canView) return null;

    // populate all attribute values and components
    exercise.attributeValues = await this.findAllAttributeValues(exercise.id);

    const components = await this.componentService.findAll();
    const tree = this.componentService.tree(components);
    const leafs = this.componentService.leafs(tree);
  }

  async findOneByIdOrFail(user: User, exerciseId: string): Promise<Exercise> {
    const exercise = await this.findOneById(user, exerciseId);
    if (!exercise) throw new BadRequestException('Exercise does not exist');
    return exercise;
  }

  /**
   * Checks if provided exercises are valid for a training. It checks that all
   * exercises' leaf components belong to the training's root components.
   *
   * For example, if training has components `Strength` and `Speed` selected,
   * then exercise with component parents `Endurance` is not valid.
   */
  async validate(componentId: string, exercises: Exercise[]): Promise<Validate> {
    // check that exercise's leaf component id belongs to training's root component id
    const components = await this.componentService.findAll();
    const tree = this.componentService.tree(components);
    const leafs = this.componentService.leafs(tree);

    // check that parents of leaf are in training's root component ids
    for (const exercise of exercises)
      for (const component of exercise.componentIds) {
        const leaf = leafs.find(leaf => leaf.id === component);
        if (!leaf || !leaf.parents.some(parent => componentId === parent.id)) {
          const found = components.find(c => c.id === component);
          return {
            error: true,
            message: `Exercise ${exercise.name} has component ${found?.name} which is not valid for training`,
          };
        }
      }

    return { error: false };
  }

  async findAllAttributes(): Promise<ExerciseAttribute[]> {
    return await this.exerciseAttributeRepository.findAll();
  }

  /**
   * Creates attribute values for an exercise. It finds each attribute by object
   * key and creates a new attribute value entry for the exercise.
   */
  private async createAttributeValues(exerciseId: string, attributeValues: Record<string, any>): Promise<ExerciseAttributeValue[]> {
    const exerciseAttributeValues = await Promise.all(
      Object.entries(attributeValues).map(async ([field, value]) => {
        const attribute = await this.exerciseAttributeRepository.findOneBy({ field: 'field', value: field });
        if (!attribute) return;
        return { exerciseId, attributeId: attribute.id, value };
      }),
    );

    return await this.exerciseAttributeValueRepository.createMany(exerciseAttributeValues);
  }

  /**
   * Finds all attribute values for an exercise and returns them as a nested
   * object, which is used for frontend display.
   */
  private async findAllAttributeValues(exerciseId: string) {
    const values = await this.exerciseAttributeValueRepository.findAllBy({ field: 'exerciseId', value: exerciseId });
    for (const value of values)
      value.attribute = await this.exerciseAttributeRepository.findOneById(value.attributeId);

    // convert found attributes and attribute values to nested object for frontend
    const nested: Record<string, any> = {};
    for (const value of values)
      nested[value.attribute.field] = value.value;

    return nested;
  }

  /**
   * Filter provided exercises by provided components. Note - if you pass in a
   * root component, all children will also be checked in the filter
   */
  private filterByComponents(exercises: Exercise[], componentIds: string[], leafs: ComponentLeaf[]) {
    const filtered: Exercise[] = [];

    for (const exercise of exercises)
      for (const exerciseComponentId of exercise.componentIds) {
        const leaf = leafs.find(leaf => leaf.id === exerciseComponentId);
        if (!leaf) continue;
        const parentIds = [leaf.id, ...leaf.parents.map(({ id }) => id)];

        for (const componentId of componentIds)
          if (parentIds.some(id => id === componentId)) {
            filtered.push(exercise);
            break;
          }
      }

    return filtered;
  }

  private async _validate(data: Partial<Exercise>): Promise<Validate<{ leafs: ComponentLeaf[] }>> {
    // atleast one component must be selected
    if (!data.componentIds?.length)
      return { error: true, message: 'No components selected' };

    // check that all components exist and are leafs
    const components = await this.componentService.findAll();
    const tree = this.componentService.tree(components);
    const leafs = this.componentService.leafs(tree);

    for (const componentId of data.componentIds!)
      if (!this.componentService.isLeafComponent(componentId, leafs)) {
        const component = components.find(c => c.id === componentId)!;
        return { error: true, message: `You cannot select component ${component.name}` };
      }

    // check that all attributes exist
    const attributes = await this.exerciseAttributeRepository.findAll();
    const attributeFields = attributes.map(({ field }) => field);
    for (const field of Object.keys(data.attributeValues || {}))
      if (!attributeFields.includes(field))
        return { error: true, message: `Attribute ${field} does not exist` };

    // check that all attribute values are of correct type
    for (const field of Object.keys(data.attributeValues || {})) {
      const attribute = attributes.find((attribute) => attribute.field === field)!;
      const value = data.attributeValues![field];

      switch (attribute.type) {
        case 'number':
          if (typeof value !== 'number')
            return { error: true, message: `Attribute ${field} must be a number` };
          break;
        case 'string':
          if (typeof value !== 'string')
            return { error: true, message: `Attribute ${field} must be a string` };
          break;
        case 'boolean':
          if (typeof value !== 'boolean')
            return { error: true, message: `Attribute ${field} must be a boolean` };
          break;
        case 'date':
          // TODO - check if date is valid
          break;
        case 'select':
          if (typeof attribute.values?.[0] === 'string') {
            // check if value is in possible values
            const options = attribute.values as string[];
            if (!options.includes(value))
              return { error: true, message: `Attribute ${field} must be one of ${attribute.values.join(', ')}` };
          } else {
            // TODO - nested select, check if value is in possible values
            const options = attribute.values as ExerciseAttributeSelectOption[];
            break;
          }
      }
    }

    return { error: false, data: { leafs } };
  }

  private map(exercises: Exercise[], relations: { components: ComponentLeaf[] }) {
    return exercises.map(exercise => {
      let components: string[] = [];

      // map component names to exercises if components are provided
      if (relations?.components)
        components = exercise.componentIds.map(id => {
          const leaf = relations.components.find(leaf => leaf.id === id);
          if (!leaf) return '';
          return leaf.parents.map(({ name }) => name).join(' > ') + ' > ' + leaf.name;
        });

      return { ...exercise, components };
    });
  }
}
