import { SportDTO, CreateSportRequest } from '@alentapp/shared';

export interface SportRepository {
    create(data: CreateSportRequest): Promise<SportDTO>;
    findByName(name: string): Promise<SportDTO | null>;
}