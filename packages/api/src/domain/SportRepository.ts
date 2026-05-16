import { SportDTO, CreateSportRequest, UpdateSportRequest } from '@alentapp/shared';

export interface SportRepository {
    create(data: CreateSportRequest): Promise<SportDTO>;
    update(id: string, data: UpdateSportRequest): Promise<SportDTO>;
    // --- Métodos de búsqueda ---
    findByName(name: string): Promise<SportDTO | null>;
    findById(id: string): Promise<SportDTO | null>;
}