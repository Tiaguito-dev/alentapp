import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateLockerUseCase } from './NewLockerUseCase.js'; // Ajustá el path si el archivo se llama distinto
import { LockerRepository } from '../../domain/LockerRepository.js';
import { LockerValidator } from '../../domain/services/LockerValidator.js';
import { CreateLockerRequest, LockerDTO } from '@alentapp/shared';

describe('CreateLockerUseCase', () => {
    
    // 1. MOCK DEL REPOSITORIO
    const mockLockerRepo = {
        findByNumber: vi.fn(),
        create: vi.fn(),
    } as unknown as LockerRepository;

    // 2. MOCK DEL VALIDADOR
    const mockLockerValidator = {
        validateCreate: vi.fn(),
    } as unknown as LockerValidator;

    // 3. INYECCIÓN DE DEPENDENCIAS AL CASO DE USO
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

    // ====================================================================
    // TESTS DEL VALIDADOR
    // ====================================================================
    it('debe invocar al LockerValidator para validar que el estado inicial sea correcto', async () => {
        // Preparamos los mocks para que todo pase bien
        vi.mocked(mockLockerRepo.findByNumber).mockResolvedValueOnce(null);
        vi.mocked(mockLockerValidator.validateCreate).mockReturnValueOnce(undefined);
        vi.mocked(mockLockerRepo.create).mockResolvedValueOnce(mockCreatedLocker as any);

        await useCase.execute(mockRequest);

        // Comprobamos que delegó la responsabilidad al validador con el dato correcto
        expect(mockLockerValidator.validateCreate).toHaveBeenCalledTimes(1);
        expect(mockLockerValidator.validateCreate).toHaveBeenCalledWith('Available');
    });

    it('debe frenar la ejecución si el validador falla (Ej: intentar crear un casillero Occupied)', async () => {
        // Hacemos que el mock del validador simule el error de estado
        vi.mocked(mockLockerValidator.validateCreate).mockImplementationOnce(() => {
            throw new Error('error de validacion: El estado inicial debe ser Available');
        });

        // Ejecutamos pasándole un status inválido
        await expect(useCase.execute({ ...mockRequest, status: 'Occupied' }))
            .rejects.toThrow('error de validacion: El estado inicial debe ser Available');

        // Nos aseguramos de que no haya intentado buscar ni guardar nada en la BD
        expect(mockLockerRepo.findByNumber).not.toHaveBeenCalled();
        expect(mockLockerRepo.create).not.toHaveBeenCalled();
    });

    // ====================================================================
    // TESTS DE REGLAS DE NEGOCIO Y BASE DE DATOS
    // ====================================================================
    it('debe lanzar error si ya existe un casillero con ese número (Regla TDD-0004)', async () => {
        vi.mocked(mockLockerValidator.validateCreate).mockReturnValueOnce(undefined);
        
        // Simulamos que findByNumber sí encuentra un casillero (ya existe el nro 10)
        vi.mocked(mockLockerRepo.findByNumber).mockResolvedValueOnce(mockCreatedLocker as any);

        await expect(useCase.execute(mockRequest))
            .rejects.toThrow('Ya existe Casillero con ese numero');

        // Nos aseguramos de que no llegó al paso de crear
        expect(mockLockerRepo.create).not.toHaveBeenCalled();
    });

    it('debe crear el casillero exitosamente si pasa las validaciones y el número está libre', async () => {
        vi.mocked(mockLockerValidator.validateCreate).mockReturnValueOnce(undefined);
        vi.mocked(mockLockerRepo.findByNumber).mockResolvedValueOnce(null); // Libre!
        vi.mocked(mockLockerRepo.create).mockResolvedValueOnce(mockCreatedLocker as any);

        const result = await useCase.execute(mockRequest);

        // Verificamos que se llamó al repo para crear con los datos exactos que mandamos
        expect(mockLockerRepo.create).toHaveBeenCalledTimes(1);
        expect(mockLockerRepo.create).toHaveBeenCalledWith(mockRequest);
        
        // Verificamos que devuelve el casillero ya armado (DTO)
        expect(result).toEqual(mockCreatedLocker);
    });
});