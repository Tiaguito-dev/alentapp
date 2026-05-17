import { SportRepository } from '../../domain/SportRepository.js';

export class DeleteSportUseCase {
    constructor(private readonly sportRepo: SportRepository) { }

    async execute(id: string): Promise<void> {
        const deletedSport = await this.sportRepo.isDeleted(id);
        if (deletedSport) {
            throw new Error('Conflicto de solicitud: El deporte ya está dado de baja');
        }

        await this.sportRepo.delete(id);
    }
}