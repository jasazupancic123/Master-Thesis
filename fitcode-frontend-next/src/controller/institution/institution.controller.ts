import { CommonService } from '@/common/service/common.service';
import { Institution } from './type/institution.type';
import { Group } from '../group/type/group.type';

const api = CommonService.instance.api;

export class InstitutionController {
  static async findAllByUser(token: string) {
    return api.get<Institution[]>('/institution', { token });
  }

  static async findAllGroups(token: string) {
    return api.get<Group[]>('/institution/group', { token });
  }
}
