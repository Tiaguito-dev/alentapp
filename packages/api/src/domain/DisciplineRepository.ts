import { DisciplineDTO } from '@alentapp/shared';

export interface DisciplineRepository {
  create(discipline: Omit<DisciplineDTO, 'id'> & { member_id: string }): Promise<DisciplineDTO>;
}