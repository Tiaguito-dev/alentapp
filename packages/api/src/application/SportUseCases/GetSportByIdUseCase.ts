import { SportRepository } from '../../domain/SportRepository.js';
import { SportDTO } from '@alentapp/shared';

export class GetSportByIdUseCase {
    constructor(
        private readonly sportRepository: SportRepository,
    ) { }

    async execute(id: string): Promise<SportDTO> {
        const sport = await this.sportRepository.findById(id);
        if (!sport) {
            throw new Error('Deporte no encontrado: No existe deporte con ese id');
        }
        return sport;
    }
}