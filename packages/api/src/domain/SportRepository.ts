import { SportDto, CreateSportRequest } from '@alentapp/shared';

export interface SportRepository {
    create(data: CreateSportRequest): Promise<SportDto>;
    findByName(name: string): Promise<SportDto | null>;
}