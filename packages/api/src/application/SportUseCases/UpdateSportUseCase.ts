import { SportRepository } from '../../domain/SportRepository.js';
import { SportValidator } from '../../domain/services/SportValidator.js';
import { SportDTO, UpdateSportRequest } from '@alentapp/shared';

// Los campos que son null los acepto, pero los tomo como que no los quiere modificar según el TDD_0020_update-sport
const filtrarAtributosNull = (data: any) => {
    Object.keys(data).forEach(key => {
        if (data[key] === null) {
            delete data[key];
        }
    });
    return data;
}

export class UpdateSportUseCase {
    constructor(
        private readonly sportRepo: SportRepository,
        private readonly sportValidator: SportValidator
    ) { }

    async execute(id: string, data: UpdateSportRequest): Promise<SportDTO> {

        const dataFiltrada = filtrarAtributosNull(data);

        // Validar existencia del deporte
        const existingSport = await this.sportRepo.findById(id);
        if (existingSport === null) {
            throw new Error('Deporte no encontrado: No existe deporte con ese id');
        }

        // --- REGLA GENERAL Si el campo cambio y no es null entonces lo valido para que después se modifique---


        if (dataFiltrada.name !== undefined && dataFiltrada.name !== existingSport.name) {
            this.sportValidator.validateNameOnUpdate(dataFiltrada.name);
        }

        if (dataFiltrada.additional_price !== undefined && dataFiltrada.additional_price !== existingSport.additional_price) {
            this.sportValidator.validateAdditionalPrice(dataFiltrada.additional_price);
        }

        if (dataFiltrada.max_capacity !== undefined && dataFiltrada.max_capacity !== existingSport.max_capacity) {
            this.sportValidator.validateMaxCapacity(dataFiltrada.max_capacity);
        }

        return this.sportRepo.update(id, dataFiltrada);
    }
}