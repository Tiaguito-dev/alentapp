import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListLockersUseCase } from './ListLockersUseCase.js'; 
import { LockerRepository } from '../../domain/LockerRepository.js';
import { LockerDTO } from '@alentapp/shared';

describe('ListLockersUseCase', () => {
    // MOCK DEL REPOSITORIO 
    const mockLockerRepo = {
        findAll: vi.fn(),
    } as unknown as LockerRepository;

    const useCase = new ListLockersUseCase(mockLockerRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe retornar la lista completa de casilleros', async () => {
        const mockLockers: LockerDTO[] = [
            { id: 'uuid-1', location: 'Vestuario A', number: 10, status: 'Available', member_id: null },
            { id: 'uuid-2', location: 'Vestuario B', number: 20, status: 'Occupied', member_id: 'socio-123' }
        ];

        vi.mocked(mockLockerRepo.findAll).mockResolvedValueOnce(mockLockers as any);

        const result = await useCase.execute();

        expect(mockLockerRepo.findAll).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockLockers);
        expect(result).toHaveLength(2);
    });

    it('debe retornar un array vacío si no hay casilleros registrados', async () => {
        vi.mocked(mockLockerRepo.findAll).mockResolvedValueOnce([]);

        const result = await useCase.execute();

        expect(mockLockerRepo.findAll).toHaveBeenCalledTimes(1);
        expect(result).toEqual([]);
    });
});