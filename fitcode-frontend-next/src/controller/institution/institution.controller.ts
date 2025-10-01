import { BaseController } from '../base.controller';
import type { Profile } from '../profile/type/user.type';
import type {
  CreateInstitution,
  Institution,
  UserId,
} from './type/institution.type';

export class InstitutionController extends BaseController {
  private static instance: InstitutionController;

  private constructor() {
    super('/institution');
  }

  static getInstance(token: string) {
    if (!this.instance) this.instance = new InstitutionController();
    this.instance.setToken(token);
    return this.instance;
  }

  async findAll() {
    return this.api.get<Institution[]>('/', {
      token: this.getToken(),
    });
  }

  async findById(id: string) {
    return this.api.get<Institution>(`/${id}`, {
      token: this.getToken(),
    });
  }

  async findMembers(id: string) {
    return this.api.get<Profile[]>(`/${id}/members`, {
      token: this.getToken(),
    });
  }

  async create(body: CreateInstitution) {
    return this.api.post<Institution>('/', body, { token: this.getToken() });
  }

  async addAthlete(institutionId: string, body: UserId) {
    return this.api.patch<void>(`/${institutionId}/athlete`, body, {
      token: this.getToken(),
    });
  }

  async removeAthlete(institutionId: string, body: UserId) {
    return this.api.delete<void>(`/${institutionId}/athlete`, {
      body,
      token: this.getToken(),
    });
  }

  async addTrainer(institutionId: string, body: UserId) {
    return this.api.patch<void>(`/${institutionId}/trainer`, body, {
      token: this.getToken(),
    });
  }

  async removeTrainer(institutionId: string, body: UserId) {
    return this.api.delete<void>(`/${institutionId}/trainer`, {
      body,
      token: this.getToken(),
    });
  }
}
