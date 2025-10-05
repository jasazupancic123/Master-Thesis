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

  static getInstance() {
    if (!this.instance) this.instance = new InstitutionController();
    return this.instance;
  }

  async findAll() {
    return this.api.get<Institution[]>('/');
  }

  async findById(id: string) {
    return this.api.get<Institution>(`/${id}`);
  }

  async findAthletes(id: string) {
    return this.api.get<Profile[]>(`/${id}/find/athletes`);
  }

  async findTrainers(id: string) {
    return this.api.get<Profile[]>(`/${id}/find/trainers`);
  }

  async create(body: CreateInstitution) {
    return this.api.post<Institution>('/', body);
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
