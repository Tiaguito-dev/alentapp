import { DisciplineDTO } from '@alentapp/shared';
import { DisciplineRepository } from '../../domain/DisciplineRepository.js';

export class GetDisciplineByIdUseCase {
  constructor(private readonly disciplineRepository: DisciplineRepository) {}

  async execute(id: string): Promise<DisciplineDTO | null> {
    return this.disciplineRepository.findById(id);
  }
}