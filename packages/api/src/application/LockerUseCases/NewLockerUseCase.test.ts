import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateLockerUseCase } from './NewLockerUseCase.js'; // Ajustá el path si el archivo se llama distinto
import { LockerRepository } from '../../domain/LockerRepository.js';
import { LockerValidator } from '../../domain/services/LockerValidator.js';
import { CreateLockerRequest, LockerDTO } from '@alentapp/shared';

describe('CreateLockerUseCase', () => {
    
    
    const mockLockerRepo = {
        findByNumber: vi.fn(),
        create: vi.fn(),
    } as unknown as LockerRepository;

    
    const mockLockerValidator = {
        validateCreate: vi.fn(),
    } as unknown as LockerValidator;

    
    const useCase = new CreateLockerUseCase(mockLockerRepo, mockLockerValidator);

    const mockRequest: CreateLockerRequest = {
        number: 10,
        location: 'Vestuario A',
        status: 'Available'
    };

    const mockCreatedLocker: LockerDTO = {
        id: 'uuid-1',
        number: 10,
        location: 'Vestuario A',
        status: 'Available',
        member_id: null
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    
    // TESTS DEL VALIDADOR
    
    it('debe invocar al LockerValidator para validar que el estado inicial sea correcto', async () => {
       
        vi.mocked(mockLockerRepo.findByNumber).mockResolvedValueOnce(null);
        vi.mocked(mockLockerValidator.validateCreate).mockReturnValueOnce(undefined);
        vi.mocked(mockLockerRepo.create).mockResolvedValueOnce(mockCreatedLocker as any);

        await useCase.execute(mockRequest);

        
        expect(mockLockerValidator.validateCreate).toHaveBeenCalledTimes(1);
        expect(mockLockerValidator.validateCreate).toHaveBeenCalledWith('Available');
    });

    it('debe frenar la ejecución si el validador falla (Ej: intentar crear un casillero Occupied)', async () => {
       
        vi.mocked(mockLockerValidator.validateCreate).mockImplementationOnce(() => {
            throw new Error('error de validacion: El estado inicial debe ser Available');
        });

        
        await expect(useCase.execute({ ...mockRequest, status: 'Occupied' }))
            .rejects.toThrow('error de validacion: El estado inicial debe ser Available');

        
        expect(mockLockerRepo.findByNumber).not.toHaveBeenCalled();
        expect(mockLockerRepo.create).not.toHaveBeenCalled();
    });

    
    // TESTS DE REGLAS DE NEGOCIO Y BASE DE DATOS
    
    it('debe lanzar error si ya existe un casillero con ese número (Regla TDD-0004)', async () => {
        vi.mocked(mockLockerValidator.validateCreate).mockReturnValueOnce(undefined);
        
        
        vi.mocked(mockLockerRepo.findByNumber).mockResolvedValueOnce(mockCreatedLocker as any);

        await expect(useCase.execute(mockRequest))
            .rejects.toThrow('Ya existe Casillero con ese numero');

        
        expect(mockLockerRepo.create).not.toHaveBeenCalled();
    });

    it('debe crear el casillero exitosamente si pasa las validaciones y el número está libre', async () => {
        vi.mocked(mockLockerValidator.validateCreate).mockReturnValueOnce(undefined);
        vi.mocked(mockLockerRepo.findByNumber).mockResolvedValueOnce(null); // Libre!
        vi.mocked(mockLockerRepo.create).mockResolvedValueOnce(mockCreatedLocker as any);

        const result = await useCase.execute(mockRequest);

        
        expect(mockLockerRepo.create).toHaveBeenCalledTimes(1);
        expect(mockLockerRepo.create).toHaveBeenCalledWith(mockRequest);
        
        
        expect(result).toEqual(mockCreatedLocker);
    });
});