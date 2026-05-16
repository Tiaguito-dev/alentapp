import { SportRepository } from '../../domain/SportRepository.js';
import { SportDTO } from '@alentapp/shared';

export class ListSportsUseCase {
    constructor(
        private readonly sportRepository: SportRepository,
    ) { }

    async execute(): Promise<SportDTO[]> {
        const sports = await this.sportRepository.getAll();
        return sports;
    }
}