import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { CreateCycleDto } from './dto/create-cycle.dto';
import { UpdateCycleDto } from './dto/update-cycle.dto';
import { CollectionReference } from 'firebase-admin/lib/firestore';
import { FirebaseService } from '../firebase/firebase.service';
import { CYCLE_COLLECTION } from '../common/const/firestore.const';
import { firestore } from 'firebase-admin';
import { CycleDto } from './dto/cycle.dto';
import { serializeToDto } from '../common/util/serialize';
import { CustomClaims } from '../common/type/custom-claims.type';
import { GroupService } from '../group/group.service';
import Timestamp = firestore.Timestamp;

@Injectable()
export class CycleService {
  private logger: Logger
  private readonly collection: CollectionReference

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly groupService: GroupService,
  ) {
    this.logger = new Logger(CycleService.name);
    this.collection = this.firebaseService.collection(CYCLE_COLLECTION);
  }

  async create(user: CustomClaims, data: CreateCycleDto) {
    const { groupId, name, description, startDate, endDate } = data;

    // check if group exists
    await this.groupService.findOneById(user, groupId);

    this.logger.debug(`Creating cycle for user ${user.uid}`);
    const cycle = await this.collection.add({
      groupId,
      name,
      description,
      startDate: firestore.Timestamp.fromDate(startDate),
      endDate: firestore.Timestamp.fromDate(endDate),
    });

    return await this.data(user, await cycle.get());
  }

  async findAll(user: CustomClaims, groupId: string) {
    // check if group exists
    await this.groupService.findOneById(user, groupId);

    const cycles = await this.collection.where('groupId', '==', groupId).get();
    return await Promise.all(cycles.docs.map(async (cycle) => this.data(user, cycle)));
  }

  async findOneById(user: CustomClaims, id: string) {
    const cycle = await this.collection.doc(id.toString()).get();
    if (!cycle.exists)
      return null

    // check if cycle's group contains user
    await this.groupService.findOneById(user, cycle.data().groupId);

    return await this.data(user, cycle);
  }

  async update(user: CustomClaims, id: string, data: UpdateCycleDto) {
    const { name, startDate, endDate } = data;

    // check if cycle exists
    const cycle = await this.findOneById(user, id);
    if (!cycle)
      throw new BadRequestException('Cycle not found');

    // check if current user is cycle's group owner
    if (cycle.group.userId !== user.uid)
      throw new UnauthorizedException()

    await this.collection.doc(id).update({
      name,
      startDate,
      endDate,
    });

    return await this.data(user, await this.collection.doc(id).get());
  }

  async remove(user: CustomClaims, id: string) {
    // check if cycle exists
    const cycle = await this.findOneById(user, id);
    if (!cycle)
      throw new BadRequestException('Cycle not found');

    // check if current user is cycle's group owner
    if (cycle.group.userId !== user.uid)
      throw new UnauthorizedException()

    await this.collection.doc(id).delete();
  }

  private async data(user: CustomClaims, document: firestore.DocumentSnapshot): Promise<CycleDto> {
    const serialized = this.serialize(document);
    return await this.populate(user, serialized);
  }

  private serialize(document: firestore.DocumentSnapshot): CycleDto {
    return serializeToDto(CycleDto, {
      id: document.id,
      groupId: document.data().groupId,
      name: document.data().name,
      description: document.data().description,
      startDate: (document.data().startDate as Timestamp).toDate(),
      endDate: (document.data().endDate as Timestamp).toDate(),
    });
  }

  private async populate(user: CustomClaims, item: CycleDto): Promise<CycleDto> {
    item.group = await this.groupService.findOneById(user, item.groupId);
    return item;
  }
}
