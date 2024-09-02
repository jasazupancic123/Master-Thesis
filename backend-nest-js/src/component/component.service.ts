import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Component } from './entity/component.entity';
import slugify from 'slugify';
import { InjectRepository } from '../common/decorator/entity.decorator';
import { FirestoreRepository } from '../firebase/firestore.repository';
import { Filter } from '../common/type/orm.type';
import { ComponentLeaf } from './type/component-leaf.type';
import { CommonService } from '../common/service/common.service';

@Injectable()
export class ComponentService {
  private logger = new Logger(ComponentService.name);

  constructor(
    private readonly commonService: CommonService,
    @InjectRepository(Component) private readonly repository: FirestoreRepository<Component>) {
  }

  async create(data: Partial<Component>): Promise<Component> {
    // TODO - check if slug is unique
    // TODO - if newly created component is leaf node, move all parent exercises to "Other" component

    this.logger.debug(`Creating component with data ${JSON.stringify(data)}`);
    return {} as Component;
  }

  async createMany(components: Component[]): Promise<void> {
    this.commonService.tree.forEach(components, 'children', async (component, parent, result) => {
      const parentId = result ?? null;
      const { name } = component;
      const slug = await this.slugify(name);

      const { id } = await this.repository.create({ name, slug, parentId });
      return id; // used as parentId in next iteration
    });
  }

  async findOneBySlug(slug: string): Promise<Component> {
    return await this.repository.findOneBy('slug', slug);
  }

  async findOneById(id: string): Promise<Component> {
    return await this.repository.findOneById(id);
  }

  async findAll(filter?: Filter): Promise<Component[]> {
    return await this.repository.findAll({ filter });
  }

  async findAllOrFail(filter?: Filter): Promise<Component[]> {
    const components = await this.repository.findAll({ filter });
    if (filter?.ids?.length && components.length !== filter.ids.length)
      throw new BadRequestException('Invalid components');

    return components;
  }

  tree(componentsFlat: Component[]): Component[] {
    return this.commonService.tree.fromArray(componentsFlat, {
      idPropertyName: 'id',
      parentIdPropertyName: 'parentId',
      childrenPropertyName: 'children',
    });
  }

  leafs(componentsTree: Component[]): ComponentLeaf[] {
    return this.commonService.tree.leafs(componentsTree, 'children');
  }

  isLeafComponent(componentId: string, leafs: ComponentLeaf[]): boolean {
    return !!leafs.find(c => c.id === componentId);
  }

  /**
   * Function `componentService.leafs(componentsTree)` returns an array of leaf
   * nodes, where each leaf node has a `parents` property that contains an array
   * of all its parent nodes. This function returns the root node of the
   * provided leaf node.
   */
  getRootComponents(componentId: string, leafs: ComponentLeaf[]): Component[] {
    const leaf = leafs.find(c => c.id === componentId);
    return leaf.parents.filter(c => c.parentId === null);
  }

  /**
   * Allows component's name and slug to be updated.
   */
  async update(id: string, data: Partial<Component>): Promise<Component> {
    // TODO - check if slug is unique
    this.logger.debug(`Updating component #${id} with data ${JSON.stringify(data)}`);
    const { name, slug } = data;

    const component = await this.repository.findOneByIdOrFail(id);
    return await this.repository.update(component.id, { name, slug });
  }

  async remove(id: string): Promise<void> {
    // TODO - move exercises to "Other" component
    // TODO - remove component
    this.logger.debug(`Removing component #${id}`);
  }

  /**
   * Slugify a name and make it unique in the collection
   */
  private async slugify(name: string) {
    let slug = slugify(name, { lower: true });

    let i = 1;
    do {
      const exists = await this.repository.findOneBy('slug', slug);
      if (!exists) {
        i = 1;
        break;
      }

      slug = `${slug}-${i++}`;
    } while (true);

    return slug;
  }
}
