import { DisciplineRepository } from '../../domain/DisciplineRepository.js';
import { DisciplineValidator } from '../../domain/services/DisciplineValidator.js';
import { DisciplineDTO } from '@alentapp/shared';


export type UpdateDisciplineRequest = Partial<Omit<DisciplineDTO, 'id'>>;

export class UpdateDisciplineUseCase {
    constructor(
        private readonly disciplineRepo: DisciplineRepository,
        private readonly disciplineValidator: DisciplineValidator 
    ) {}

    async execute(id: string, data: UpdateDisciplineRequest): Promise<DisciplineDTO> {
        
        const existingDiscipline = await this.disciplineRepo.findById(id);
        if (!existingDiscipline) {
            throw new Error('La disciplina no existe');
        }

        
        const startDateStr = data.start_date || existingDiscipline.start_date;
        const endDateStr = data.end_date || existingDiscipline.end_date;

        if (startDateStr && endDateStr) {
            const start = new Date(startDateStr);
            const end = new Date(endDateStr);

            if (end < start) {
                throw new Error('La fecha de fin no puede ser mayor a la de inicio');
            }
        }

        

        
        return this.disciplineRepo.update(id, data);
    }
}