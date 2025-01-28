import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Exercise } from '../entity/exercise.entity';
import { FirebaseService } from '../../firebase/firebase.service';
import { ComponentService } from '../../component/component.service';
import { Component } from '../../component/entity/component.entity';
import { CommonService } from '../../common/service/common.service';
import {
  Filter,
  FindManyOptions,
  FindOneOptions,
  PaginateOptions,
  Populate,
} from '../../common/type/orm.type';
import { Validate } from '../../common/type/validate.type';
import { FieldPath, Query, Timestamp } from 'firebase-admin/firestore';
import { ExerciseRepository } from '../repository/exercise.repository';
import { DEFAULT_PAGE_SIZE } from '../../common/constant/pagination.constant';
import { ExerciseRef } from '../../common/type/firebase-firestore.type';
import { ExerciseAttributeService } from './exercise-attribute.service';
import { ExerciseAttributeValueService } from './exercise-attribute-value.service';
import { Wrapper } from '../../common/type/wrapper.type';
import { User } from '../../common/type/firebase-auth.type';

@Injectable()
export class ExerciseService {
  private logger = new Logger(ExerciseService.name);

  constructor(
    private readonly exerciseRepository: ExerciseRepository,
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly exerciseAttributeService: ExerciseAttributeService,
    private readonly exerciseAttributeValueService: ExerciseAttributeValueService,
    @Inject(forwardRef(() => ComponentService))
    private readonly componentService: Wrapper<ComponentService>,
  ) {}

  /**
   * Finds all exercises by user. Admin can create global exercises, and
   * every user can create his own exercises. Since Firestore does not support
   * OR queries, these two conditions for user must be queried separately.
   * Therefore, pagination must be performed in plain JS, not Firestore.
   */
  async findAllGlobal(
    options?: Omit<FindManyOptions<Exercise>, 'paginate'>,
  ): Promise<Exercise[]> {
    let query = this.exerciseRepository
      .collection()
      .where('global', '==', true);

    const components = await this.componentService.findAllFlat();
    if (options?.filter) query = this.filter(query, options.filter, components);

    const exercises = await query
      .get()
      .then((snapshot) =>
        snapshot.docs.map((doc) => this.exerciseRepository.serialize(doc)),
      );

    gif(options?.populate);
    for (const exercise of exercises)
      await this.populate(
        { exerciseId: exercise.id },
        exercise,
        options.populate,
      );

    return exercises;
  }

  async findAllByUser(
    user: User,
    options?: Omit<FindManyOptions<Exercise>, 'paginate'>,
  ): Promise<Exercise[]> {
    let query = this.exerciseRepository.collection() as Query;

    // necessary filter either by `global` or `userId`
    if (options?.filter?.global) query = query.where('global', '==', true);
    else query = query.where('userId', '==', user.uid);

    const components = await this.componentService.findAllFlat();
    if (options?.filter) query = this.filter(query, options.filter, components);

    const exercises = await query
      .get()
      .then((snapshot) =>
        snapshot.docs.map((doc) => this.exerciseRepository.serialize(doc)),
      );

    if (options?.populate)
      for (const exercise of exercises)
        await this.populate(
          { exerciseId: exercise.id },
          exercise,
          options.populate,
        );

    return exercises;
  }

  /**
   * For internal use to find all exercises without pagination.
   */
  async findAll(
    user: User,
    options?: FindManyOptions<Exercise>,
  ): Promise<Exercise[]> {
    const userExercises = await this.findAllByUser(user, {
      ...options,
      populate: options?.populate,
      filter: { ...options?.filter, global: false },
    });

    const globalExercises = await this.findAllByUser(user, {
      ...options,
      populate: options?.populate,
      filter: { ...options?.filter, global: true },
    });

    return this.commonService.array.unique([
      ...userExercises,
      ...globalExercises,
    ]);
  }

  async findAllPagination(
    user: User,
    options?: FindManyOptions<Exercise>,
  ): Promise<{ data: Exercise[]; total: number }> {
    const userExercises = await this.findAllByUser(user, {
      ...options,
      populate: options?.populate,
      filter: { ...options?.filter, global: false },
    });

    const globalExercises = await this.findAllByUser(user, {
      ...options,
      populate: options?.populate,
      filter: { ...options?.filter, global: true },
    });

    let exercises = this.commonService.array.unique([
      ...userExercises,
      ...globalExercises,
    ]);

    const total = exercises.length;
    if (options?.paginate)
      exercises = this.paginate(exercises, options?.paginate);

    return { data: exercises, total };
  }

  async findOne(
    ref: Required<ExerciseRef>,
    options?: FindOneOptions<Exercise> & { userId?: string },
  ): Promise<Exercise | null> {
    // find exercise
    const exercise = await this.exerciseRepository.getDoc(ref.exerciseId);
    if (!exercise) return null;

    // authorize
    if (options?.userId)
      if (!exercise.global && exercise.userId !== options.userId) return null;

    if (options?.populate) await this.populate(ref, exercise, options.populate);
    return exercise;
  }

  async findOneByName(name: string): Promise<Exercise | null> {
    const query = this.exerciseRepository
      .collection()
      .where('name', '==', name);

    const snapshot = await query.get();
    if (snapshot.empty) return null;
    return this.exerciseRepository.serialize(snapshot.docs[0]);
  }

  async findOneOrFail(
    ref: Required<ExerciseRef>,
    options?: FindOneOptions<Exercise> & { userId?: string },
  ): Promise<Exercise> {
    const exercise = await this.findOne(ref, options);
    if (!exercise) throw new BadRequestException('Exercise does not exist');
    return exercise;
  }

  async create(user: User, data: Partial<Exercise>) {
    this.logger.debug(`Creating new exercise for user ${user.uid}`);

    // validate exercise attributes
    await this.exerciseAttributeService.validate(data.attributeValues || {});

    // validate exercise data
    const { error, message } = await this.validate(data);
    if (error) throw new BadRequestException(message);

    // find all root components of selected leaf components
    const components = await this.componentService.findAllFlat({
      populate: ['children', 'parents'],
    });

    const leafs = this.componentService.leafsFromFlat(components);
    const roots: Component[] = [];
    for (const componentId of data.componentsIds) {
      const component = leafs.find((c) => c.id === componentId)!;
      const root = this.componentService.getRoot(component, components);
      roots.push(root);
    }

    // create exercise
    const exerciseId = await this.exerciseRepository.addDoc({
      userId: user.uid,
      name: data.name,
      componentsIds: data.componentsIds,
      global: this.firebaseService.isAdmin(user), // if user is admin, exercise is global
      videoUrl: data.videoUrl,
      imageUrl: data.imageUrl,
    });

    // create attribute values from provided nested object
    const exerciseAttributeRef = { uid: user.uid, exerciseId };
    await this.exerciseAttributeValueService.createMany(
      exerciseAttributeRef,
      data.attributeValues || {},
    );

    return {
      id: exerciseId,
      rootComponentIds: roots.map(({ id }) => id), // used for frontend
    };
  }

  /**
   * "Moves" all provided exercises to the provided component (it only changes
   * the component id of the exercise).
   */
  async move(
    user: User,
    exerciseIds: string[],
    componentId: string,
  ): Promise<void> {
    // check if component id exists and is leaf node
    const components = await this.componentService.findAllFlat({
      populate: ['children', 'parents'],
    });
    const leafs = this.componentService.leafsFromFlat(components);

    const leaf = this.componentService.getLeafBySlug(componentId, leafs);
    if (!leaf) throw new BadRequestException('Invalid component id');

    // update all exercises
    const batch = this.firebaseService.firestore.batch();
    for (const exerciseId of exerciseIds) {
      const document = this.exerciseRepository.doc(exerciseId);
      batch.update(document, { componentsIds: [componentId] });
    }

    await batch.commit();
  }

  async update() {
    // TODO
  }

  async remove() {
    // TODO
  }

  /**
   * Checks if provided exercises are valid for a training. It checks that all
   * exercises' leaf components belong to the training's root components.
   *
   * For example, if training has components `Strength` and `Speed` selected,
   * then exercise with component parents `Endurance` is not valid.
   */
  async validateExercises(
    componentId: string,
    exercises: Exercise[],
  ): Promise<Validate> {
    // check that exercise's leaf component id belongs to training's root component id
    const components = await this.componentService.findAllFlat({
      populate: ['children', 'parents'],
    });
    const leafs = this.componentService.leafsFromFlat(components);

    // check that parents of leaf are in training's root component ids
    for (const exercise of exercises)
      for (const component of exercise.componentsIds) {
        const leaf = leafs.find((leaf) => leaf.id === component);

        if (!leaf || !leaf.parents.some((parent) => componentId === parent)) {
          const found = components.find((c) => c.id === component);
          return {
            error: true,
            message: `Exercise ${exercise.name} has component ${found?.name} which is not valid for training`,
          };
        }
      }

    return { error: false };
  }

  private async validate(data: Partial<Exercise>): Promise<Validate> {
    // at least one component must be selected
    if (!data.componentsIds?.length)
      return { error: true, message: 'No components selected' };

    // check that all components exist and are leafs
    const components = await this.componentService.findAllLeafs({
      populate: ['children', 'parents'],
    });
    for (const slug of data.componentsIds!) {
      const component = await this.componentService.getLeafBySlug(
        slug,
        components,
      );
      if (!component)
        return { error: true, message: `Component ${slug} does not exist` };
    }

    return { error: false };
  }

  private filter(
    query: Query,
    filter: Filter<Exercise>,
    components: Component[], // flat components
  ): Query {
    if (filter.ids?.length)
      query = query.where(FieldPath.documentId(), 'in', filter.ids);

    if (filter.componentsIds) {
      // for each component id, find all children and filter by them
      const componentsIds: string[] = [];
      for (const componentId of filter.componentsIds.value as string[]) {
        const component = components.find((c) => c.id === componentId);
        if (!component) continue;

        // filter by root node
        componentsIds.push(component.id);

        // filter by all its children
        const tree = this.commonService.tree.fromArray(components, {
          rootId: component.id,
          idPropertyName: 'id',
          parentIdPropertyName: 'parent',
          childrenPropertyName: 'children',
        });

        this.commonService.tree.forEach(tree, 'children', (item) => {
          componentsIds.push(item.id);
          return null;
        });
      }

      if (componentsIds.length)
        query = query.where(
          'componentIds',
          'array-contains-any',
          componentsIds,
        );
    }

    if (filter.name)
      query = query
        .where('name', '>=', filter.name.value)
        .where('name', '<=', filter.name.value + '\uf8ff');

    if (filter.createdAt)
      query = query.where(
        'createdAt',
        filter.createdAt.op || '>=',
        Timestamp.fromDate(filter.createdAt.value),
      );

    if (filter.updatedAt)
      query = query.where(
        'updatedAt',
        filter.updatedAt.op || '>=',
        Timestamp.fromDate(filter.updatedAt.value),
      );

    return query;
  }

  private paginate(
    data: Exercise[],
    paginate: PaginateOptions<Exercise>,
  ): Exercise[] {
    return this.commonService.generic.paginate(data, {
      orderBy: paginate.orderBy || { field: 'createdAt', value: 'desc' },
      page: paginate.page || 1,
      pageSize: paginate.pageSize || DEFAULT_PAGE_SIZE,
    });
  }

  private async populate(
    ref: Required<ExerciseRef>,
    exercise: Exercise,
    populate: Populate<Exercise>[],
  ) {
    if (populate.includes('components')) {
      const componentPopulateOptions: Populate<Component>[] = [];
      if (populate.includes('components.parents'))
        componentPopulateOptions.push('parents');
      if (populate.includes('components.children'))
        componentPopulateOptions.push('children');

      exercise.components = await this.componentService.findAllFlat({
        filter: { ids: exercise.componentsIds },
        populate: componentPopulateOptions,
      });
    }

    if (populate.includes('attributeValues'))
      exercise.attributeValues =
        await this.exerciseAttributeValueService.findAllAsObject(ref);
  }
}
