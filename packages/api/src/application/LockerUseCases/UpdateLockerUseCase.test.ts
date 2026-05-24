import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateLockerUseCase } from './UpdateLockerUseCase.js';
import { LockerRepository } from '../../domain/LockerRepository.js';
import { LockerValidator } from '../../domain/services/LockerValidator.js';
import { LockerDTO } from '@alentapp/shared';

describe('UpdateLockerUseCase', () => {
    
    // 1. MOCK DEL REPOSITORIO
    const mockLockerRepo = {
        findByNumber: vi.fn(),
        findByMemberId: vi.fn(),
        update: vi.fn(),
    } as unknown as LockerRepository;

    // 2. MOCK DEL VALIDADOR 
    const mockLockerValidator = {
        validateUpdate: vi.fn(),
    } as unknown as LockerValidator;

    // 3. INYECCIÓN DE DEPENDENCIAS AL CASO DE USO
    const useCase = new UpdateLockerUseCase(mockLockerRepo, mockLockerValidator);

    const mockAvailableLocker: LockerDTO = {
        id: 'uuid-1',
        location: 'Vestuario A',
        number: 10,
        status: 'Available',
        member_id: null,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe invocar al LockerValidator para validar las reglas de negocio antes de actualizar', async () => {
        vi.mocked(mockLockerRepo.findByNumber).mockResolvedValueOnce(mockAvailableLocker as any);
        vi.mocked(mockLockerRepo.findByMemberId).mockResolvedValueOnce(null);
        vi.mocked(mockLockerRepo.update).mockResolvedValueOnce({
            ...mockAvailableLocker,
            status: 'Occupied',
            member_id: 'socio-nuevo'
        } as any);

        // Simulamos que la validación pasa sin errores
        vi.mocked(mockLockerValidator.validateUpdate).mockReturnValueOnce(undefined);

        await useCase.execute(10, { member_id: 'socio-nuevo' });

        // VERIFICAMOS: Comprobamos el mock inyectado en vez del spy
        expect(mockLockerValidator.validateUpdate).toHaveBeenCalledTimes(1);
        expect(mockLockerValidator.validateUpdate).toHaveBeenCalledWith(
            mockAvailableLocker,
            'Occupied', // Tu UseCase deduce esto automáticamente y se lo pasa al Validator
            'socio-nuevo'
        );
    });

    it('debe frenar la ejecución y lanzar el error si el LockerValidator falla (Ej: Regla A)', async () => {
        // Simulamos un escenario donde el validador va a fallar: 
        // Intentar asignar un socio a un casillero que ya está en Mantenimiento.
        const mockMaintenanceLocker = { ...mockAvailableLocker, status: 'Maintenance' };
        vi.mocked(mockLockerRepo.findByNumber).mockResolvedValueOnce(mockMaintenanceLocker as any);

        // Hacemos que nuestro mock del validador lance el error a propósito
        vi.mocked(mockLockerValidator.validateUpdate).mockImplementationOnce(() => {
            throw new Error('error: casillero en mantenimiento');
        });

        // El UseCase ejecuta, llama internamente al Validator, y el Validator lanza el error
        await expect(useCase.execute(10, { member_id: 'socio-nuevo' }))
            .rejects.toThrow('error: casillero en mantenimiento');
            
        expect(mockLockerRepo.update).not.toHaveBeenCalled();
    });

    // ====================================================================
    // REGLAS DEL USE CASE Y BASE DE DATOS
    // ====================================================================
    it('debe lanzar error si el casillero no existe', async () => {
        vi.mocked(mockLockerRepo.findByNumber).mockResolvedValueOnce(null);

        await expect(useCase.execute(99, { status: 'Maintenance' }))
            .rejects.toThrow('El casillero especificado no fue encontrado');
            
        expect(mockLockerRepo.update).not.toHaveBeenCalled();
    });

    it('debe lanzar error si el socio ya tiene otro casillero asignado (Regla 1 a 1)', async () => {
        vi.mocked(mockLockerRepo.findByNumber).mockResolvedValueOnce(mockAvailableLocker as any);
        
        vi.mocked(mockLockerRepo.findByMemberId).mockResolvedValueOnce({ 
            number: 5, member_id: 'socio-123' 
        } as any);

        await expect(useCase.execute(10, { member_id: 'socio-123' }))
            .rejects.toThrow('ya tiene un casillero asignado');
            
        expect(mockLockerRepo.update).not.toHaveBeenCalled();
    });

    it('debe mutar el estado a Occupied automáticamente si se asigna un socio y guardar en BD', async () => {
        vi.mocked(mockLockerRepo.findByNumber).mockResolvedValueOnce(mockAvailableLocker as any);
        vi.mocked(mockLockerRepo.findByMemberId).mockResolvedValueOnce(null);
        
        // Simulamos que pasa la validación sin problemas
        vi.mocked(mockLockerValidator.validateUpdate).mockReturnValueOnce(undefined);
        vi.mocked(mockLockerRepo.update).mockResolvedValueOnce({} as any);

        await useCase.execute(10, { member_id: 'socio-123' });

        expect(mockLockerRepo.update).toHaveBeenCalledWith(10, expect.objectContaining({
            member_id: 'socio-123',
            status: 'Occupied'
        }));
    });
});