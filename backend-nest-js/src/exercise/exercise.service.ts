import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ExerciseEntity } from './entity/exercise.entity';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { ComponentService } from '../component/component.service';
import { ComponentDto } from '../component/dto/component.dto';
import { FilterExerciseDto } from './dto/filter-exercise.dto';
import { CustomClaims } from '../common/type/custom-claims.type';
import { SetGroupEntity } from '../set/entity/set-group.entity';
import { InjectRepository } from '../common/decorator/entity.decorator';
import { FirestoreRepository } from '../firebase/firestore.repository';
import { ExerciseAttribute } from './entity/exercise-attribute.entity';
import { ExerciseAttributeValue } from './entity/exercise-attribute-value.entity';

type ComponentLeaf = ComponentDto & { parents: ComponentDto[] }

@Injectable()
export class ExerciseService {
  private logger = new Logger(ExerciseService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    @InjectRepository(ExerciseEntity)
    private readonly repository: FirestoreRepository<ExerciseEntity>,
    @InjectRepository(ExerciseAttribute)
    private readonly exerciseAttributeRepository: FirestoreRepository<ExerciseAttribute>,
    @InjectRepository(ExerciseAttributeValue)
    private readonly exerciseAttributeValueRepository: FirestoreRepository<ExerciseAttributeValue>,
    private readonly componentService: ComponentService,
  ) {
  }

  async create(user: CustomClaims, data: CreateExerciseDto) {
    this.logger.debug(`Creating new exercise for user ${user.uid}`);
    const isAdmin = this.firebaseService.isAdmin(user);

    // only admin can create global exercises
    const { componentIds, global } = data;
    if (global && !isAdmin)
      throw new UnauthorizedException();

    // atleast one component must be selected
    if (!componentIds.length)
      throw new BadRequestException('No components selected');

    // check that all components exist and are leafs
    const components = await this.componentService.findAll();
    const tree = this.componentService.tree(components);
    const leafs = this.componentService.leafs(tree);

    for (const componentId of componentIds) {
      const isLeaf = this.componentService.isLeafComponent(componentId, leafs);
      if (!isLeaf)
        throw new BadRequestException(`Component with id ${componentId} is not a leaf`);
    }

    const roots: ComponentDto[] = [];
    for (const componentId of componentIds)
      roots.push(...this.componentService.getRootComponents(componentId, leafs));

    const item = { ...data, userId: user.uid, createdAt: new Date().toISOString() };
    const reference = await this.repository.create(item as any);

    return {
      id: reference.id,
      rootComponentIds: roots.map(({ id }) => id),
    };
  }

  /**
   * If user is admin, return all exercises in database, if user is manager,
   * return all exercises from every trainer under the manager, if user is
   * trainer, return all exercises from the trainer, if user is athlete,
   * return only his exercises
   */
  async findAll(user: CustomClaims, filter?: FilterExerciseDto): Promise<ExerciseEntity[]> {
    let filtered = await this.repository.findAll();

    // get exercises components
    const components = await this.componentService.findAll();
    const tree = this.componentService.tree(components);
    const leafs = this.componentService.leafs(tree);

    // filter global exercises and exercises where user is owner
    filtered = filtered.filter(exercise => {
      return exercise.userId === user.uid || exercise.global;
    });

    // filter by provided filters
    filtered = filtered.filter(exercise => {
      // filter by ids
      if (filter.ids?.length && !filter.ids.includes(exercise.id))
        return false;

      // filter by name
      const name = (exercise.name as string).toLowerCase();
      if (filter.name && !name.includes(filter.name.toLowerCase()))
        return false;

      // accept all if no filters are provided
      return true;
    });

    // filter by components
    if (filter.componentIds?.length)
      filtered = this.filterByComponents(filtered, filter.componentIds, leafs);

    // TODO - if user is admin, return all exercises
    // TODO - if user is athlete, check all trainers he belongs to and get their exercises
    // TODO - if user is manager, get all trainers under him and get their exercises

    // limit
    const limit = filter?.limit ? +filter.limit : 100;
    return this.map(filtered.slice(0, limit), { components: leafs });
  }

  async findAllAttributes(): Promise<ExerciseAttribute[]> {
    return await this.exerciseAttributeRepository.findAll();
  }

  /**
   * Return only user's exercises
   */
  async findOneById(user: CustomClaims, exerciseId: string): Promise<ExerciseEntity> {
    return await this.repository.findOneById(exerciseId);
  }

  async findOneByIdOrFail(user: CustomClaims, exerciseId: string): Promise<ExerciseEntity> {
    const exercise = await this.findOneById(user, exerciseId);
    if (!exercise)
      throw new BadRequestException('Exercise does not exist');

    return exercise;
  }

  async isValidSetGroupExercise(user: CustomClaims, exercises: ExerciseEntity[], set: SetGroupEntity): Promise<boolean> {
    // check that exercise's leaf component id belongs to training's root component id
    const components = await this.componentService.findAll();
    const tree = this.componentService.tree(components);
    const leafs = this.componentService.leafs(tree);

    // check that parents of leaf are in training's root component ids
    for (const exercise of exercises)
      for (const componentId of exercise.componentIds) {
        const leaf = leafs.find(leaf => leaf.id === componentId);
        if (!leaf || !leaf.parents.some(parent => set.componentId === parent.id))
          return false;
      }

    return true;
  }

  /**
   * Only owner of the exercise and admin can update it
   */
  async update(user: CustomClaims, exerciseId: string, data: UpdateExerciseDto) {
    this.logger.debug(`Updating exercise ${exerciseId} for user ${user.uid}`);
    const { componentIds, global } = data;

    const isAdmin = this.firebaseService.isAdmin(user);

    // only admin can update global exercises
    if (global && !isAdmin)
      throw new UnauthorizedException('Only admin can create global exercises');

    // check if user is owner of exercise
    const exercise = await this.findOneById(user, exerciseId);
    if (!exercise || exercise.userId !== user.uid)
      throw new UnauthorizedException();

    // atleast one component must be selected
    if (!componentIds.length)
      throw new BadRequestException('No components selected');

    // check that all components exist and are leafs
    const components = await this.componentService.findAll();
    const tree = this.componentService.tree(components);
    const leafs = this.componentService.leafs(tree);

    for (const componentId of componentIds) {
      const isLeaf = this.componentService.isLeafComponent(componentId, leafs);
      if (!isLeaf)
        throw new BadRequestException(`Component with id ${componentId} is not a leaf`);
    }

    const roots: ComponentDto[] = [];
    for (const componentId of componentIds)
      roots.push(...this.componentService.getRootComponents(componentId, leafs));

    const item = { ...data, userId: user.uid, createdAt: new Date().toISOString() };
    await this.repository.update(exerciseId, item as any);

    return {
      rootComponentIds: roots.map(({ id }) => id),
    };
  }

  /**
   * Only owner of the exercise and admin can delete it
   */
  async remove(userId: string, exerciseId: string): Promise<void> {
    this.logger.debug(`Removing exercise ${exerciseId} for user ${userId}`);
  }

  /**
   * Filter provided exercises by provided components. Note - if you pass in a
   * root component, all children will also be checked in the filter
   */
  private filterByComponents(exercises: ExerciseEntity[], componentIds: string[], leafs: ComponentLeaf[]) {
    const filtered: ExerciseEntity[] = [];

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

  /**
   * Maps exercises
   */
  private map(exercises: ExerciseEntity[], mapping?: { components?: ComponentLeaf[] }) {
    return exercises.map(exercise => {
      let components: string[] = [];

      // map component names to exercises if components are provided
      if (mapping?.components)
        components = exercise.componentIds.map(id => {
          const leaf = mapping.components.find(leaf => leaf.id === id);
          if (!leaf) return '';
          return leaf.parents.map(({ name }) => name).join(' > ') + ' > ' + leaf.name;
        });

      return { ...exercise, components };
    });
  }
}
