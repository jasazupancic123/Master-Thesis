import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ExerciseDto } from './dto/exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { CollectionReference } from 'firebase-admin/lib/firestore';
import { ComponentService } from '../component/component.service';
import { serializeToDto } from '../common/util/serialize';
import { EXERCISE_COLLECTION } from '../common/const/firestore.const';
import { ComponentDto } from '../component/dto/component.dto';
import { FilterExerciseDto } from './dto/filter-exercise.dto';
import { CustomClaims } from '../common/type/custom-claims.type';

type ComponentLeaf = ComponentDto & { parents: ComponentDto[] }

@Injectable()
export class ExerciseService {
  private logger: Logger;
  private readonly collection: CollectionReference

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly componentService: ComponentService
  ) {
    this.logger = new Logger(ExerciseService.name)
    this.collection = firebaseService.firestore.collection(EXERCISE_COLLECTION);
  }

  async create(user: CustomClaims, data: CreateExerciseDto) {
    this.logger.debug(`Creating new exercise for user ${user.uid}`)
    const isAdmin = this.firebaseService.isAdmin(user)

    // only admin can create global exercises
    const {componentIds, global} = data
    if (global && !isAdmin)
      throw new UnauthorizedException()

    // atleast one component must be selected
    if (!componentIds.length)
      throw new BadRequestException('No components selected')

    // check that all components exist and are leafs
    const components = await this.componentService.findAll()
    const tree = this.componentService.tree(components)
    const leafs = this.componentService.leafs(tree)

    for (const componentId of componentIds) {
      const isLeaf = this.componentService.isLeafComponent(componentId, leafs);
      if (!isLeaf)
        throw new BadRequestException(`Component with id ${componentId} is not a leaf`)
    }

    const roots: ComponentDto[] = []
    for (const componentId of componentIds)
      roots.push(...this.componentService.getRootComponents(componentId, leafs))

    const item = { ...data, userId: user.uid, createdAt: new Date().toISOString() }
    const reference = await this.collection.add(item as any);

    return {
      id: reference.id,
      rootComponentIds: roots.map(({ id }) => id),
    }
  }

  /**
   * If user is admin, return all exercises in database, if user is manager,
   * return all exercises from every trainer under the manager, if user is
   * trainer, return all exercises from the trainer, if user is athlete,
   * return only his exercises
   */
  async findAll(user: CustomClaims, filter?: FilterExerciseDto): Promise<ExerciseDto[]> {
    const exercises = await this.collection.get();

    // get exercises components
    const components = await this.componentService.findAll();
    const tree = this.componentService.tree(components);
    const leafs = this.componentService.leafs(tree);

    // filter by id, name and global
    const { name, componentIds } = filter || {}
    const filtered = exercises.docs
      .filter(doc => {
        const data = doc.data()

        // filter by name
        const dataName = (data.name as string).toLowerCase()
        const filterName = name?.toLowerCase()
        if (name && !dataName.includes(filterName)) return false

        // accepted
        return true
      })
      .map(doc =>
        serializeToDto(ExerciseDto, { id: doc.id, ...doc.data() }))

    // filter by components
    if (componentIds.length) {
      const filteredByComponents = this.filterByComponents(filtered, componentIds, leafs)
      return this.map(filteredByComponents, { components: leafs })
    }

    // TODO - if user is admin, return all exercises
    // TODO - if user is athlete, check all trainers he belongs to and get their exercises
    // TODO - if user is manager, get all trainers under him and get their exercises

    return this.map(filtered, { components: leafs })
  }

  /**
   * Return only user's exercises
   */
  async findOne(user: CustomClaims, exerciseId: string): Promise<ExerciseDto> {
    const document = await this.collection.doc(exerciseId).get();
    return serializeToDto(ExerciseDto, {id: document.id, ...document.data()})
  }

  /**
   * Only owner of the exercise and admin can update it
   */
  async update(user: CustomClaims, exerciseId: string, data: UpdateExerciseDto) {
    this.logger.debug(`Updating exercise ${exerciseId} for user ${user.uid}`)
    const {componentIds, global} = data

    const isAdmin = this.firebaseService.isAdmin(user)

    // only admin can update global exercises
    if (global && !isAdmin)
      throw new UnauthorizedException('Only admin can create global exercises')

    // check if user is owner of exercise
    const exercise = await this.findOne(user, exerciseId);
    if (!exercise || exercise.userId !== user.uid)
      throw new UnauthorizedException()

    // atleast one component must be selected
    if (!componentIds.length)
      throw new BadRequestException('No components selected')

    // check that all components exist and are leafs
    const components = await this.componentService.findAll()
    const tree = this.componentService.tree(components)
    const leafs = this.componentService.leafs(tree)

    for (const componentId of componentIds) {
      const isLeaf = this.componentService.isLeafComponent(componentId, leafs);
      if (!isLeaf)
        throw new BadRequestException(`Component with id ${componentId} is not a leaf`)
    }

    const roots: ComponentDto[] = []
    for (const componentId of componentIds)
      roots.push(...this.componentService.getRootComponents(componentId, leafs))

    const item = { ...data, userId: user.uid, createdAt: new Date().toISOString() }
    await this.collection.doc(exerciseId).update(item as any);

    return {
      rootComponentIds: roots.map(({ id }) => id),
    }
  }

  /**
   * Only owner of the exercise and admin can delete it
   */
  async remove(userId: string, exerciseId: string): Promise<void> {
    this.logger.debug(`Removing exercise ${exerciseId} for user ${userId}`)
  }

  /**
   * Filter provided exercises by provided components. Note - if you pass in a
   * root component, all children will also be checked in the filter
   */
  private filterByComponents(exercises: ExerciseDto[], componentIds: string[], leafs: ComponentLeaf[]) {
    const filtered: ExerciseDto[] = [];

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
  private map(exercises: ExerciseDto[], mapping?: { components?: ComponentLeaf[] }) {
    return exercises.map(exercise => {
      let components: string[] = [];

      // map component names to exercises if components are provided
      if (mapping?.components)
        components = exercise.componentIds.map(id => {
          const leaf = mapping.components.find(leaf => leaf.id === id);
          if (!leaf) return '';
          return leaf.parents.map(({ name }) => name).join(' > ') + ' > ' + leaf.name;
        });

      return { ...exercise, components }
    })
  }
}
