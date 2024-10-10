import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Component } from './entity/component.entity';
import { Filter, FindManyOptions, Populate } from '../common/type/orm.type';
import { CommonService } from '../common/service/common.service';
import { ComponentRepository } from './repository/component.repository';
import { ExerciseService } from '../exercise/service/exercise.service';
import { Wrapper } from '../common/type/wrapper.type';
import { FieldPath, Query } from 'firebase-admin/firestore';

@Injectable()
export class ComponentService {
  private logger = new Logger(ComponentService.name);

  constructor(
    private readonly commonService: CommonService,
    private readonly componentRepository: ComponentRepository,
    @Inject(forwardRef(() => ExerciseService))
    private readonly exerciseService: Wrapper<ExerciseService>,
  ) {}

  async create(data: Partial<Component>): Promise<Component> {
    this.logger.debug(`Creating component with data ${JSON.stringify(data)}`);
    const componentSlug = await this.componentRepository.addDoc(data);

    // TODO - if newly created component is leaf node, move all parent exercises to "Other" component

    return await this.componentRepository.getDoc(componentSlug);
  }

  async createFromTree(
    data: Omit<Component, 'children'> & { children: Component[] },
  ): Promise<Component> {
    const { children, ...rest } = data;
    const component = await this.create(rest);

    for (const child of children) {
      const childData = {
        ...child,
        parent: component.id,
        children: child.children as unknown as Component[],
      };
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

  async findAllFlat(
    options?: FindManyOptions<Component>,
  ): Promise<Component[]> {
    const components = await this.componentRepository.getDocs((collection) => {
      let query = collection;
      if (options?.filter) query = this.filter(query, options.filter);
      return query;
    });

    if (options?.populate)
      for (const component of components)
        this.populate(component, components, options.populate);

    return components;
  }

  async findAllTree(
    options?: FindManyOptions<Component>,
  ): Promise<Component[]> {
    if (options?.populate?.includes('children'))
      // remove 'children' from populate, as it will be populated in the tree
      options.populate = options.populate.filter((p) => p !== 'children');

    const components = await this.findAllFlat(options);
    return this.commonService.tree.fromArray(components, {
      idPropertyName: 'id',
      parentIdPropertyName: 'parent',
      childrenPropertyName: 'children',
    });
  }

  async findAllLeafs(options?: FindManyOptions<Component>) {
    const components = await this.findAllFlat({
      ...options,
      populate: ['children', 'parents'],
    });
    return this.leafsFromFlat(components);
  }

  leafsFromFlat(components: Component[]): Component[] {
    if (components.every((component) => !component.children.length))
      throw new Error(
        'To get leafs from flat components array, populate `children` first',
      );

    return components.filter((c) => !c.children.length);
  }

  async findAllOrFail(
    options?: FindManyOptions<Component>,
  ): Promise<Component[]> {
    const components = await this.findAllFlat(options);
    if (
      options?.filter?.ids?.length &&
      components.length !== options?.filter.ids.length
    )
      throw new BadRequestException('Invalid components');

    return components;
  }

  async getLeafBySlug(
    slug: string,
    leafs?: Component[],
  ): Promise<Component | null> {
    if (!leafs)
      leafs = await this.findAllLeafs({ populate: ['children', 'parents'] });
    return leafs.find((c) => c.slug === slug) || null;
  }

  getRoot(component: Component, components: Component[]): Component | null {
    if (component.parents.length === 0) return component;

    for (const parentId of component.parents) {
      const parent = components.find((c) => c.id === parentId);
      if (parent?.parents.length === 0) return parent;
    }

    return null;
  }

  /**
   * Allows component's name and slug to be updated.
   */
  async update(id: string, data: Partial<Component>): Promise<Component> {
    this.logger.debug(
      `Updating component #${id} with data ${JSON.stringify(data)}`,
    );

    const component = await this.componentRepository.getDoc(id);
    if (!component) throw new BadRequestException('Component not found');

    await this.componentRepository.updateDoc(id, data);
    return component;
  }

  private filter(query: Query, filter: Filter<Component>) {
    if (filter.ids)
      query = query.where(FieldPath.documentId(), 'in', filter.ids);

    if (filter.name)
      query = query
        .where('name', '>=', filter.name)
        .where('name', '<=', filter.name + '\uf8ff');

    if (filter.slug) query = query.where('slug', '==', filter.slug);
    return query;
  }

  private populate(
    component: Component,
    components: Component[], // flat components
    populate: Populate<Component>[],
  ) {
    if (populate.includes('parents')) {
      const parents: Component[] = [];

      let parent = components.find((c) => c.id === component.parent);
      while (parent) {
        parents.push(parent);
        parent = components.find((c) => c.id === parent.parent);
      }

      component.parents = parents.map((p) => p.id);
    }

    if (populate.includes('children'))
      component.children = components
        .filter((c) => c.parent === component.id)
        .map((c) => c.id);
  }
}
