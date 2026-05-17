import { DisciplineDTO } from '@alentapp/shared';
import { UpdateDisciplineRequest } from '../application/DisciplineUseCases/UpdateDisciplineUseCase.js';

export interface DisciplineRepository {
  create(discipline: Omit<DisciplineDTO, 'id'> & { member_id: string }): Promise<DisciplineDTO>;
  findAll(): Promise<DisciplineDTO[]>;
  findById(id: string): Promise<DisciplineDTO | null>;
  delete(id: string): Promise<void>; 
  update(id: string, data: UpdateDisciplineRequest): Promise<DisciplineDTO>; 
}