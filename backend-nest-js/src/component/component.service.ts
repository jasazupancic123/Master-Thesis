import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Component } from './entity/component.entity';
import { Filter, FindManyOptions, Populate } from '../common/type/orm.type';
import { CommonService } from '../common/service/common.service';
import { ComponentRepository } from './repository/component.repository';
import { ExerciseService } from '../exercise/service/exercise.service';
import { Wrapper } from '../common/type/wrapper.type';
import { Query } from 'firebase-admin/firestore';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class ComponentService {
  private logger = new Logger(ComponentService.name);

  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly componentRepository: ComponentRepository,
    @Inject(forwardRef(() => ExerciseService))
    private readonly exerciseService: Wrapper<ExerciseService>,
  ) {
  }

  rootCollection() {
    return this.componentRepository.collection();
  }

  async create(data: Partial<Component>): Promise<Component> {
    this.logger.debug(`Creating component with data ${JSON.stringify(data)}`);
    const componentSlug = await this.componentRepository.addDoc(data);

    // TODO - if newly created component is leaf node, move all parent exercises to "Other" component

    return await this.componentRepository.getDoc(componentSlug);
  }

  async createFromTree(data: Component): Promise<Component> {
    const component = await this.create(data);
    for (const child of data.children) {
      const childData = { ...child, parent: component.id };
      await this.createFromTree(childData);
    }

    return component;
  }

  async findOneBySlug(slug: string): Promise<Component> {
    return await this.componentRepository.getDoc(slug);
  }

  async findOneBySlugOrFail(slug: string): Promise<Component> {
    const component = await this.componentRepository.getDoc(slug);
    if (!component) throw new BadRequestException('Component not found');
    return component;
  }

  async findAllFlat(options?: FindManyOptions<Component>): Promise<Component[]> {
    const components = await this.componentRepository.getDocs((collection) => {
      let query = collection;
      if (options?.filter) query = this.filter(query, options.filter);
      return query;
    });

    if (options?.populate) this.populate(components, options.populate);
    return components;
  }

  async findAllTree(options?: FindManyOptions<Component>): Promise<Component[]> {
    if (options?.populate.includes('children')) // remove 'children' from populate, as it will be populated in the tree
      options.populate = options.populate.filter(p => p !== 'children');

    const components = await this.findAllFlat(options);
    return this.commonService.tree.fromArray(components, {
      idPropertyName: 'id',
      parentIdPropertyName: 'parent',
      childrenPropertyName: 'children',
    });
  }

  async findAllLeafs(options?: FindManyOptions<Component>) {
    const components = await this.findAllFlat({ ...options, populate: ['children', 'parents'] });
    return this.leafsFromFlat(components);
  }

  leafsFromFlat(components: Component[]): Component[] {
    if (components.every(component => !component.children.length))
      throw new Error('To get leafs from flat components array, populate `children` first');

    return components.filter(c => !c.children.length);
  }

  async findAllOrFail(options?: FindManyOptions<Component>): Promise<Component[]> {
    const components = await this.findAllFlat(options);
    if (options?.filter?.ids?.length && components.length !== options?.filter.ids.length)
      throw new BadRequestException('Invalid components');

    return components;
  }

  async getLeafBySlug(slug: string, leafs?: Component[]): Promise<Component | null> {
    if (!leafs) leafs = await this.findAllLeafs({ populate: ['children', 'parents'] });
    return leafs.find(c => c.slug === slug) || null;
  }

  async getRootBySlug(slug: string, leaf?: Component): Promise<Component | null> {
    if (!leaf) leaf = await this.getLeafBySlug(slug);
    return leaf?.parents.find(c => c.parent === null) || null;
  }

  /**
   * Allows component's name and slug to be updated.
   */
  async update(id: string, data: Partial<Component>): Promise<Component> {
    this.logger.debug(`Updating component #${id} with data ${JSON.stringify(data)}`);

    const component = await this.componentRepository.getDoc(id);
    if (!component) throw new BadRequestException('Component not found');

    await this.componentRepository.updateDoc(id, data);
    return component;
  }

  private filter(query: Query, filter: Filter<Component>) {
    if (filter.ids) query = query.where('id', 'in', filter.ids);
    if (filter.name) query = query.where('name', '>=', filter.name).where('name', '<=', filter.name + '\uf8ff');
    if (filter.slug) query = query.where('slug', '==', filter.slug);
    return query;
  }

  private populate(flatComponents: Component[], populate: Populate<Component>[]) {
    for (const component of flatComponents) {
      if (populate.includes('children'))
        component.children = flatComponents.filter(c => c.parent === component.id);

      if (populate.includes('parents')) {
        const parents: Component[] = [];
        let parent = flatComponents.find(c => c.id === component.parent);
        while (parent) {
          parents.push(parent);
          parent = flatComponents.find(c => c.id === parent.parent);
        }

        component.parents = parents;
      }
    }
  }
}
