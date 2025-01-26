import { Cycle } from '../entity/cycle.entity';

export type CreateCycle = Pick<Cycle, 'name' | 'description' | 'from' | 'to'>

export type UpdateCycle = Partial<CreateCycle>