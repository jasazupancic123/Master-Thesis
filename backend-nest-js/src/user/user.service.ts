import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { PublicUserDto } from './dto/user.dto';
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
    });

    filtered = filtered.filter(record => {
      const claims = record.customClaims as CustomClaims;

      // return all users if user is an admin
      if (this.firebaseService.isAdmin(user))
        return true;

      // return all trainers if user is a manager
      if (this.firebaseService.isManager(user))
        return this.firebaseService.isTrainer(claims);

      // return all athletes if user is a trainer
      if (this.firebaseService.isTrainer(user))
        return this.firebaseService.isAthlete(claims);

      // return only current user if user is an athlete
      if (this.firebaseService.isAthlete(user))
        return record.uid === user.uid;
    });

    // remove current user from the list
    filtered = filtered.filter(record => record.uid !== user.uid);
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