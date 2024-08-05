import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { PublicUserDto, UserDto } from './dto/user.dto';
import { serializeToDto } from '../common/util/serialize';
import { UpdateUserClaimsDto, UpdateUserDto } from './dto/update-user.dto';
import { FilterUserDto } from './dto/filter-user.dto';
import { UserRecord } from 'firebase-admin/auth';
import { CustomClaims } from '../common/type/custom-claims.type';

@Injectable()
export class UserService {
  private logger: Logger;

  constructor(private readonly firebaseService: FirebaseService) {
    this.logger = new Logger(UserService.name);
  }

  async findOne(uid: string): Promise<UserRecord> {
    return await this.firebaseService.auth.getUser(uid);
  }

  async findAll(user: CustomClaims, filter?: FilterUserDto) {
    const { users } = await this.firebaseService.auth.listUsers();
    const { email } = filter || {};

    let classType = PublicUserDto;
    let filtered = users.filter(record => {
      if (email && !record.email.includes(email)) return false;

      // return true if no filter is applied
      return true;
    })

    // get only athletes if user is an athlete or trainer
    if (this.firebaseService.isAthlete(user) || this.firebaseService.isTrainer(user))
      filtered = filtered.filter(record => {
        const claims = record.customClaims as CustomClaims;
        return this.firebaseService.isAthlete(claims) || this.firebaseService.isTrainer(claims);
      });

    // get only trainers if user is a manager
    if (this.firebaseService.isManager(user))
      filtered = filtered.filter(record => {
        const claims = record.customClaims as CustomClaims;
        return this.firebaseService.isTrainer(claims);
      });

    // return all data if user is an admin
    if (this.firebaseService.isAdmin(user)) {
      filtered = users;
      classType = UserDto;
    }

    // remove current user from the list
    filtered = filtered.filter(record => record.uid !== user.uid);

    // serialize data
    return serializeToDto(classType, filtered);
  }

  async update(uid: string, data: UpdateUserDto): Promise<void> {
    await this.firebaseService.auth.updateUser(uid, data);
  }

  async updateClaims(uid: string, claims: UpdateUserClaimsDto): Promise<void> {
    const customClaims = (await this.findOne(uid)).customClaims;
    await this.firebaseService.auth.setCustomUserClaims(uid, { ...customClaims, ...claims });
  }

  async remove(uid: string): Promise<void> {
    await this.firebaseService.auth.deleteUser(uid);
  }
}