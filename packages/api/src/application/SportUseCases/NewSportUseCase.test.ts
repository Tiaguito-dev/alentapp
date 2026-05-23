import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateSportUseCase } from './NewSportUseCase.js';
import { SportRepository } from '../../domain/SportRepository.js';
import { SportValidator } from '../../domain/services/SportValidator.js';
import { CreateSportRequest } from '@alentapp/shared';

// AGRUPO TODOS LOS TEST RELACIONADOS CON LA CREACIÓN DE DEPORTES

// MOCKEAR EN BASE AL ENTORNO AISLADO

// CreateSportUseCase me pide:
/*
    constructor(
        private readonly sportRepository: SportRepository,
        private readonly sportValidator: SportValidator
        ) { }
*/

// Entonces voy a mockear:
// sportRepository
// sportValidator
// (Solo las funciones que utiliza CreateSportUseCase, no necesito mockear todo el repositorio ni el validador)

// NÚCLEO
//const result=useCase.execute(mockRequest) 
// const useCase = new CreateSportUseCase(sportRepository, sportValidator)

// LIMPIAR LOS TEST
// beforeEach(() => {
//     vi.clearAllMocks();
// });

// ARRANCO CON LOS TEST (GUIANDOME CON LOS CA)

// Test 1
// Dado una solicitud de creación de deporte
// Si existe un deporte con el mismo nombre
// No debe registrar el nuevo deporte y debe dar una alerta

describe('CreateSportUseCase', () => {
    const mockSportRepository = {
        create: vi.fn(), // No mockeo todas los métodos, solo el que me interesa
    } as unknown as SportRepository

    // Qué funciones de validator utiliza CreateSportUseCase?
    /*
        validateUniqueName, validateAdditionalPrice, validateMaxCapacity
    */
    const mockSportValidator = {
        validateUniqueName: vi.fn(),
        validateAdditionalPrice: vi.fn(),
        validateMaxCapacity: vi.fn(),
    } as unknown as SportValidator

    const useCase = new CreateSportUseCase(mockSportRepository, mockSportValidator);

    beforeEach(() => {
        vi.clearAllMocks();
    });


    it('No debe registrar un deporte y debe generar una alerta si el nombre del deporte ya existe en el reservorio de datos', async () => {
        const mockRequest: CreateSportRequest = {
            name: 'Natacion',
            description: null,
            max_capacity: 10,
            additional_price: 100,
            requires_medical_certificate: false
        }

        // vi.mocked(mockSportValidator.validateAdditionalPrice)
        // No simulamos el comportamiento de validateUniqueName porque lo que queremos es verificar que se llame y que si lanza un error, el caso de uso no intente crear el deporte ni validar los otros campos
        // Se simula si devuelve un error porque el nombre ya existe

        vi.mocked(mockSportValidator.validateUniqueName).mockRejectedValueOnce(new Error('Nombre inválido: Ya existe un deporte con ese nombre'));

        // Ejecutamos el caso de uso
        await expect(
            useCase.execute(mockRequest)
        ).rejects.toThrow('Nombre inválido: Ya existe un deporte con ese nombre')

        // Verificamos que se haya llamado a validateUniqueName con el nombre del deporte
        expect(mockSportValidator.validateUniqueName).toHaveBeenCalledWith('Natacion');

        // Verificamos que se haya intentado validar el nombre único pero no se haya intentado validar los otros campos ni crear el deporte
        expect(mockSportValidator.validateAdditionalPrice).not.toHaveBeenCalled();
        expect(mockSportValidator.validateMaxCapacity).not.toHaveBeenCalled();
        expect(mockSportRepository.create).not.toHaveBeenCalled();
    });

})

