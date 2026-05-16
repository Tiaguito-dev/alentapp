import { SportRepository } from '../SportRepository.js';

export class SportValidator {
    constructor(private readonly sportRepository: SportRepository) { }

    async validateUniqueName(name: string): Promise<void> {
        const existSport = await this.sportRepository.findByName(name);
        if (existSport !== null) {
            throw new Error('Nombre inválido: Ya existe un deporte con ese nombre');
        }
    }

    validateAdditionalPrice(additionalPrice: number): void {
        if (additionalPrice < 0) {
            throw new Error('Número inválido: El precio adicional no puede ser negativo');
        }
    }

    validateMaxCapacity(maxCapacity: number): void {
        if (maxCapacity <= 0) {
            throw new Error('Número inválido: La capacidad maxima debe ser mayor a cero');
        }
        if (!Number.isInteger(maxCapacity)) {
            throw new Error('Número inválido: La capacidad maxima debe ser un número entero');
        }
    }

    /*
    // ESTO SE HACE EN EL CASO DE USO
    
    async validateExistSportId(id: string): Promise<void> {
        const existSport = await this.sportRepository.findById(id);
        if (existSport === null) {
            throw new Error('Deporte no encontrado: No existe deporte con ese id');
        }
    }
    */

    validateNameOnUpdate(name: string): void {
        if (name === null) {
            throw new Error('Conflicto de solicitud: El nombre de un deporte registrado no puede ser modificado');
        }
    }
}