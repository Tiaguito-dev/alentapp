import { SportRepository } from '../../domain/SportRepository.js';
import { SportValidator } from '../../domain/services/SportValidator.js';
import { SportDto, CreateSportRequest } from '@alentapp/shared';

export class CreateSportUseCase {
    constructor(
        private readonly sportRepository: SportRepository,
        private readonly sportValidator: SportValidator
    ) { }

    async execute(data: CreateSportRequest): Promise<SportDto> {
        await this.sportValidator.validateUniqueName(data.name);
        this.sportValidator.validateAdditionalPrice(data.additional_price);
        this.sportValidator.validateMaxCapacity(data.max_capacity);

        const newSport = await this.sportRepository.create({
            ...data,
            created_at: new Date().toISOString(),
        });

        return newSport;
    }
}