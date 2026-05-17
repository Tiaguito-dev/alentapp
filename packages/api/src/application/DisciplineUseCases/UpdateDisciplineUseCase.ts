import { DisciplineRepository } from '../../domain/DisciplineRepository.js';
import { DisciplineValidator } from '../../domain/services/DisciplineValidator.js';
import { DisciplineDTO, UpdateDisciplineRequest } from '@alentapp/shared'; 

export class UpdateDisciplineUseCase {
    constructor(
        private readonly disciplineRepo: DisciplineRepository,
        private readonly disciplineValidator: DisciplineValidator 
    ) {}

    async execute(id: string, data: UpdateDisciplineRequest): Promise<DisciplineDTO> {
        
        // 1. Comprobar existencia
        const existingDiscipline = await this.disciplineRepo.findById(id);
        if (!existingDiscipline) {
            throw new Error('La disciplina no existe');
        }

        // 2. Consolidar fechas (lo nuevo o lo que ya estaba en DB)
        const startDateStr = data.start_date || existingDiscipline.start_date;
        const endDateStr = data.end_date || existingDiscipline.end_date;

        // 3. El validador ahora analiza formatos y consistencia cronológica de forma segura
        this.disciplineValidator.validateUpdate({
            name: data.name,
            startDateStr,
            endDateStr
        });

        // 4. Persistir
        return this.disciplineRepo.update(id, data);
    }
}