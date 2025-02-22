import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { FieldPath, Query } from 'firebase-admin/firestore';
import { Create, Update } from 'src/common/type/entity.type';
import { CommonService } from '../common/service/common.service';
import { Filter } from '../common/type/orm.type';
import { Wrapper } from '../common/type/wrapper.type';
import { ExerciseService } from '../exercise/service/exercise.service';
import { Component } from './entity/component.entity';
import { ComponentRepository } from './repository/component.repository';

@Injectable()
export class ComponentService {
  private logger = new Logger(ComponentService.name);

  constructor(
    private readonly commonService: CommonService,
    private readonly componentRepository: ComponentRepository,
    @Inject(forwardRef(() => ExerciseService))
    private readonly exerciseService: Wrapper<ExerciseService>,
  ) {}

  async create(data: Create<Component>): Promise<Component> {
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

  async findAllFlat(filter?: Filter<Component>): Promise<Component[]> {
    const components = await this.componentRepository.getDocs((collection) => {
      let query = collection;
      if (filter) query = this.filter(query, filter);
      return query;
    });

    for (const component of components) this.populate(component, components);
    return components;
  }

  async findAllTree(filter?: Filter<Component>): Promise<Component[]> {
    const components = await this.findAllFlat(filter);
    return this.commonService.tree.fromArray(components, {
      idPropertyName: 'id',
      parentIdPropertyName: 'parent',
      childrenPropertyName: 'children',
    });
  }

  leafsFromFlat(components: Component[]): Component[] {
    if (components.every((component) => !component.children.length))
      throw new Error(
        'To get leafs from flat components array, populate `children` first',
      );

    return components.filter((c) => !c.children.length);
  }

  /**
   * Finds leaf component by slug
   * @param slug - component slug
   * @param components - leaf components
   */
  getLeafBySlug(slug: string, components: Component[]): Component | null {
    return components.find((c) => c.slug === slug) || null;
  }

  /**
   * Finds root of component by traversing parents tree.
   * @param component - component to find the root of
   * @param components - components populated with `parents` array
   */
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
  async update(
    id: string,
    data: Update<Component, 'name' | 'parent' | 'slug'>,
  ): Promise<Component> {
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

    if (filter.slug) query = query.where('slug', '==', filter.slug);

    return query;
  }

  private populate(
    component: Component,
    components: Component[], // flat components
  ) {
    // populate parents
    const parents: Component[] = [];
    let parent = components.find((c) => c.id === component.parent);
    while (parent) {
      parents.push(parent);
      parent = components.find((c) => c.id === parent.parent);
    }

    component.parents = parents.map((p) => p.id);

    // populate children
    component.children = components
      .filter((c) => c.parent === component.id)
      .map((c) => c.id);
  }
}
