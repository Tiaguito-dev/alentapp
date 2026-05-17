import { DisciplineRepository } from '../../domain/DisciplineRepository.js';
import { DisciplineValidator } from '../../domain/services/DisciplineValidator.js';
import { DisciplineDTO, UpdateDisciplineRequest } from '@alentapp/shared'; 

export class UpdateDisciplineUseCase {
    constructor(
        private readonly disciplineRepo: DisciplineRepository,
        private readonly disciplineValidator: DisciplineValidator 
    ) {}

    async execute(id: string, data: UpdateDisciplineRequest): Promise<DisciplineDTO> {
        
        // 1. Comprobar existencia en la base de datos
        const existingDiscipline = await this.disciplineRepo.findById(id);
        if (!existingDiscipline) {
            throw new Error('La disciplina no existe'); // O tu excepción personalizada NotFound
        }

        // 2. Consolidar fechas para la validación de negocio
        // Como 'start_date' no cambia, usamos siempre el de la BD. 
        // 'end_date' usa el nuevo valor del request, o cae en el actual si no se envió.
        const startDateStr = existingDiscipline.start_date;
        const endDateStr = data.end_date || existingDiscipline.end_date;

        // 3. El validador analiza la consistencia cronológica de forma segura
        // Eliminamos 'name' de aquí porque el validador no lo necesita para el update
        this.disciplineValidator.validateUpdate({
            startDateStr,
            endDateStr
        });

        // 4. Persistir los cambios permitidos
        return this.disciplineRepo.update(id, data);
    }
}