import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetLockerByNumberUseCase } from './GetLockerByNumberUseCase.js';
import { LockerRepository } from '../../domain/LockerRepository.js';
import { LockerDTO } from '@alentapp/shared';

describe('GetLockerByNumberUseCase', () => {
    // MOCK DEL REPOSITORIO
    const mockLockerRepo = {
        findByNumber: vi.fn(),
    } as unknown as LockerRepository;

    const useCase = new GetLockerByNumberUseCase(mockLockerRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe retornar el casillero solicitado si existe', async () => {
        const mockLocker: LockerDTO = { 
            id: 'uuid-1', location: 'Vestuario A', number: 10, status: 'Available', member_id: null 
        };

        vi.mocked(mockLockerRepo.findByNumber).mockResolvedValueOnce(mockLocker as any);

        const result = await useCase.execute(10);

        expect(mockLockerRepo.findByNumber).toHaveBeenCalledTimes(1);
        expect(mockLockerRepo.findByNumber).toHaveBeenCalledWith(10);
        expect(result).toEqual(mockLocker);
    });

    it('debe lanzar un error si el casillero no existe', async () => {
        vi.mocked(mockLockerRepo.findByNumber).mockResolvedValueOnce(null);

        
        await expect(useCase.execute(999)).rejects.toThrow('El casillero especificado no fue encontrado');
    });
});