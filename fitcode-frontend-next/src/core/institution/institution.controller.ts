import { BaseController } from '../base.controller';
import type { Profile } from '../profile/type/user.type';
import type {
  CreateInstitution,
  Institution,
  UpdateInstitution,
  UserId,
} from './type/institution.type';
import type { FetchOptions } from '@/lib/common/type/api.type';

export class InstitutionController extends BaseController {
  private static instance: InstitutionController;

  private constructor() {
    super('/institution');
  }

  static getInstance() {
    if (!this.instance) this.instance = new InstitutionController();
    return this.instance;
  }

  async findAll(options?: FetchOptions) {
    return this.api.get<Institution[]>('/', options);
  }

  async findById(id: string) {
    return this.api.get<Institution>(`/${id}`);
  }

  async findMembers(id: string) {
    return this.api.get<Profile[]>(`/${id}/members`);
  }

  async create(body: CreateInstitution) {
    return this.api.post<Institution>('/', body);
  }

  async update(institutionId: string, body: UpdateInstitution) {
    return this.api.patch<Institution>(`/${institutionId}`, body);
  }

  async addAthlete(institutionId: string, body: UserId) {
    return this.api.patch<void>(`/${institutionId}/athlete`, body);
  }

  async removeAthlete(institutionId: string, body: UserId) {
    return this.api.delete<void>(`/${institutionId}/athlete`, { body });
  }

  async addTrainer(institutionId: string, body: UserId) {
    return this.api.patch<void>(`/${institutionId}/trainer`, body);
  }

  async removeTrainer(institutionId: string, body: UserId) {
    return this.api.delete<void>(`/${institutionId}/trainer`, { body });
  }
}
