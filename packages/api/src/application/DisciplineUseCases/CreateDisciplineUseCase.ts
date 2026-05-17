import { DisciplineRepository } from '../../domain/DisciplineRepository.js';
import { DisciplineValidator } from '../../domain/services/DisciplineValidator.js';
import { CreateDisciplineRequest, DisciplineDTO } from '@alentapp/shared';

export class CreateDisciplineUseCase {
  constructor(
    private readonly disciplineRepository: DisciplineRepository,
    private readonly disciplineValidator: DisciplineValidator
  ) {}

  async execute(data: CreateDisciplineRequest): Promise<DisciplineDTO> {
    
    this.disciplineValidator.validateName(data.name);
    this.disciplineValidator.validateDates(data.start_date, data.end_date);

    
    const nuevaDisciplina = await this.disciplineRepository.create({
      name: data.name,
      description: data.description ?? null,
      start_date: data.start_date,
      end_date: data.end_date,
      is_total_suspension: false, 
      member_id: data.member_id,
    });

    return nuevaDisciplina;
  }
}