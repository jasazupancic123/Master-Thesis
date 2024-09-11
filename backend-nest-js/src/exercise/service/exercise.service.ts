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
import { User } from '../../common/type/firebase-auth.type';
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
import {
  ExerciseRef,
  UserRef,
} from '../../common/type/firebase-firestore.type';
import { CanViewService } from '../../common/type/auth.type';
import { UserRepository } from '../../user/repository/user.repository';
import { ExerciseAttributeService } from './exercise-attribute.service';
import { ExerciseAttributeValueService } from './exercise-attribute-value.service';
import { Wrapper } from '../../common/type/wrapper.type';

@Injectable()
export class ExerciseService extends CanViewService<ExerciseRef> {
  private logger = new Logger(ExerciseService.name);

  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly exerciseRepository: ExerciseRepository,
    @Inject(forwardRef(() => ComponentService))
    private readonly componentService: Wrapper<ComponentService>,
    private readonly userRepository: UserRepository,
    private readonly exerciseAttributeService: ExerciseAttributeService,
    private readonly exerciseAttributeValueService: ExerciseAttributeValueService,
  ) {
    super();
  }

  async canView(user: User, ref: Required<ExerciseRef>): Promise<boolean> {
    const exercise = await this.exerciseRepository.getDoc(ref.exerciseId);
    if (!exercise) return false;

    if (
      exercise.global ||
      this.firebaseService.isAdmin(user) ||
      exercise.userId === user.uid
    )
      return true;

    // false by default
    return false;
  }

  async countExercises(
    ref: Required<UserRef>,
    options?: FindManyOptions<Exercise>,
  ): Promise<number> {
    let query = this.exerciseRepository.collection() as Query;

    // necessary filter either by `global` or `userId`
    if (options?.filter?.global) query = query.where('global', '==', true);
    else query = query.where('userId', '==', ref.uid);

    const components = await this.componentService.findAllFlat();
    if (options?.filter) query = this.filter(query, options.filter, components);
    return await query
      .count()
      .get()
      .then((snapshot) => snapshot.data().count);
  }

  async findUserExercises(
    ref: Required<UserRef>,
    options?: FindManyOptions<Exercise>,
  ): Promise<Exercise[]> {
    let query = this.exerciseRepository.collection() as Query;

    // necessary filter either by `global` or `userId`
    if (options?.filter?.global?.value)
      query = query.where('global', '==', true);
    else query = query.where('userId', '==', ref.uid);

    const components = await this.componentService.findAllFlat();
    if (options.filter) query = this.filter(query, options.filter, components);
    if (options.paginate) query = this.paginate(query, options.paginate);

    const exercises = await query
      .get()
      .then((snapshot) =>
        snapshot.docs.map((doc) => this.exerciseRepository.serialize(doc)),
      );

    if (options.populate)
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
  async findExercises(
    ref: Required<UserRef>,
    options?: Omit<FindManyOptions<Exercise>, 'paginate'>,
  ): Promise<Exercise[]> {
    const userExercises = await this.findUserExercises(ref, {
      ...options,
      paginate: undefined,
      populate: options?.populate,
      filter: { ...options?.filter, global: { value: false } },
    });

    const globalExercises = await this.findUserExercises(ref, {
      ...options,
      paginate: undefined,
      populate: options?.populate,
      filter: { ...options?.filter, global: { value: true } },
    });

    return this.commonService.array.unique([
      ...userExercises,
      ...globalExercises,
    ]);
  }

  async findExercise(
    ref: Required<ExerciseRef>,
    options?: FindOneOptions<Exercise>,
  ): Promise<Exercise | null> {
    const exercise = await this.exerciseRepository.getDoc(ref.exerciseId);
    if (!exercise) return null;

    if (options?.populate) await this.populate(ref, exercise, options.populate);
    return exercise;
  }

  async findExerciseByName(name: string): Promise<Exercise | null> {
    const query = this.exerciseRepository
      .collection()
      .where('name', '==', name);

    const snapshot = await query.get();
    if (snapshot.empty) return null;
    return this.exerciseRepository.serialize(snapshot.docs[0]);
  }

  async findExerciseOrFail(
    ref: Required<ExerciseRef>,
    options?: FindOneOptions<Exercise>,
  ): Promise<Exercise> {
    const exercise = await this.findExercise(ref, options);
    if (!exercise) throw new BadRequestException('Exercise does not exist');
    return exercise;
  }

  async findUserExercise(
    user: User,
    ref: Required<ExerciseRef>,
    options?: FindOneOptions<Exercise>,
  ): Promise<Exercise | null> {
    await this.authorize(user, ref);
    return this.findExercise(ref, options);
  }

  async findUserExerciseOrFail(
    user: User,
    ref: Required<ExerciseRef>,
    options?: FindOneOptions<Exercise>,
  ): Promise<Exercise> {
    await this.authorize(user, ref);
    return this.findExerciseOrFail(ref, options);
  }

  async createExercise(
    user: User,
    ref: Required<UserRef>,
    data: Partial<Exercise>,
  ) {
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
      userId: ref.uid,
      name: data.name,
      componentsIds: data.componentsIds,
      global: this.firebaseService.isAdmin(user), // if user is admin, exercise is global
      videoUrl: data.videoUrl,
      imageUrl: data.imageUrl,
    });

    // create attribute values from provided nested object
    const exerciseAttributeRef = { uid: ref.uid, exerciseId };
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
    ref: Required<UserRef>,
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

    if (filter.global) query = query.where('global', '==', filter.global.value);

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
        .where('name', '>=', filter.name)
        .where('name', '<=', filter.name + '\uf8ff');

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

  private paginate(query: Query, paginate: PaginateOptions<Exercise>): Query {
    const orderBy = paginate.orderBy || { field: 'createdAt', value: 'desc' };
    const page = paginate.page || 1;
    const pageSize = paginate.pageSize || DEFAULT_PAGE_SIZE;

    return query
      .orderBy(orderBy.field, orderBy.value)
      .limit(pageSize)
      .offset((page - 1) * pageSize);
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
