import { SportDTO, CreateSportRequest, UpdateSportRequest } from '@alentapp/shared';

export interface SportRepository {
    create(data: CreateSportRequest): Promise<SportDTO>;
    update(id: string, data: UpdateSportRequest): Promise<SportDTO>;
    delete(id: string): Promise<void>;

    // --- Métodos de búsqueda ---
    findByName(name: string): Promise<SportDTO | null>;
    findById(id: string): Promise<SportDTO | null>;
    getAll(): Promise<SportDTO[]>;
    isDeleted(id: string): Promise<boolean>;
}