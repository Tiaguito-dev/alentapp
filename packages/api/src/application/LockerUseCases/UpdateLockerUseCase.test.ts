import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateLockerUseCase } from './UpdateLockerUseCase.js';
import { LockerRepository } from '../../domain/LockerRepository.js';

describe('UpdateLockerUseCase', () => {
    // Armamos el mock del repositorio
    const mockLockerRepo = {
        findByNumber: vi.fn(),
        findByMemberId: vi.fn(),
        update: vi.fn(),
    } as unknown as LockerRepository;

    const useCase = new UpdateLockerUseCase(mockLockerRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe lanzar error si el casillero no existe', async () => {
        vi.mocked(mockLockerRepo.findByNumber).mockResolvedValueOnce(null);

        await expect(useCase.execute(99, { status: 'Maintenance' }))
            .rejects.toThrow('El casillero especificado no fue encontrado');
    });

    it('debe lanzar error si el socio ya tiene otro casillero asignado (Regla 1 a 1)', async () => {
        // 1. El casillero a editar existe y está libre
        vi.mocked(mockLockerRepo.findByNumber).mockResolvedValueOnce({ 
            number: 10, status: 'Available', member_id: null 
        } as any);

        // 2. Simulamos que la DB nos dice que este socio YA TIENE el casillero 5
        vi.mocked(mockLockerRepo.findByMemberId).mockResolvedValueOnce({ 
            number: 5, member_id: 'socio-123' 
        } as any);

        // 3. Verificamos que frene la actualización
        await expect(useCase.execute(10, { member_id: 'socio-123' }))
            .rejects.toThrow('ya tiene un casillero asignado');
    });

    it('debe mutar el estado a Occupied automáticamente si se asigna un socio', async () => {
        vi.mocked(mockLockerRepo.findByNumber).mockResolvedValueOnce({ 
            number: 10, status: 'Available', member_id: null 
        } as any);
        vi.mocked(mockLockerRepo.findByMemberId).mockResolvedValueOnce(null);
        vi.mocked(mockLockerRepo.update).mockResolvedValueOnce({ 
            number: 10, status: 'Occupied', member_id: 'socio-123' 
        } as any);

        await useCase.execute(10, { member_id: 'socio-123' });

        // Verificamos que el use case le inyectó status: 'Occupied' antes de guardar
        expect(mockLockerRepo.update).toHaveBeenCalledWith(10, expect.objectContaining({
            member_id: 'socio-123',
            status: 'Occupied'
        }));
    });
});