import { DisciplineDTO } from '@alentapp/shared';
import { DisciplineRepository } from '../../domain/DisciplineRepository.js';

export class ListDisciplinesUseCase {
  constructor(private readonly disciplineRepository: DisciplineRepository) {}

  async execute(): Promise<DisciplineDTO[]> {
    return this.disciplineRepository.findAll();
  }
}