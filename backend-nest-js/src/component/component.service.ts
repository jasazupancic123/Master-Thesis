import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CollectionReference } from 'firebase-admin/firestore';
import { ComponentDto } from './dto/component.dto';
import { Tree } from '../common/util/tree';
import { UpdateComponentDto } from './dto/update-component.dto';
import { serializeToDto } from '../common/util/serialize';
import { COMPONENT_COLLECTION } from '../common/const/firestore.const';

@Injectable()
export class ComponentService {
  private logger: Logger
  private readonly collection: CollectionReference

  constructor(private readonly firebaseService: FirebaseService) {
    this.logger = new Logger(ComponentService.name);
    this.collection = firebaseService.collection(COMPONENT_COLLECTION);
  }

  async findOne(id: string): Promise<ComponentDto> {
    const component = await this.collection.doc(id).get();
    if (!component.exists)
      return null

    return serializeToDto(ComponentDto, component.data());
  }

  async findAll(): Promise<ComponentDto[]> {
    const components = await this.collection.get();
    return components.docs.map(doc => serializeToDto(ComponentDto, { id: doc.id, ...doc.data() }))
  }

  tree(componentsFlat: ComponentDto[]): ComponentDto[] {
    return Tree.fromArray(componentsFlat, {
      idPropertyName: 'id',
      parentIdPropertyName: 'parentId',
      childrenPropertyName: 'children'
    })
  }

  leafs(componentsTree: ComponentDto[]): (ComponentDto & { parents: ComponentDto[] })[] {
    return Tree.leafs(componentsTree, 'children');
  }

  isLeafComponent(componentId: string, leafs: (ComponentDto & { parents: ComponentDto[] })[]): boolean {
    return !!leafs.find(c => c.id === componentId);
  }

  getRootComponents(componentId: string, leafs: (ComponentDto & { parents: ComponentDto[] })[]): ComponentDto[] {
    const leaf = leafs.find(c => c.id === componentId);
    return leaf.parents.filter(c => c.parentId === null);
  }

  async update(userId: string, componentId: string, data: UpdateComponentDto): Promise<string> {
    // TODO - when component's parent is updated, all exercises that are using this component should have parentName, parentId and rootIds updated

    this.logger.debug(`Updating component #${componentId} with data ${JSON.stringify(data)}`)
    const {name} = data;

    // check if component exists
    const component = await this.collection.doc(componentId).get();
    if (!component.exists)
      throw new BadRequestException(`Component with id ${componentId} not found`);

    await this.collection.doc(componentId).update({name});
    return componentId;
  }
}
