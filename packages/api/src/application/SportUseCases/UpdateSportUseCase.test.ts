import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateSportUseCase } from './UpdateSportUseCase.js';
import { SportRepository } from '../../domain/SportRepository.js';
import { SportValidator } from '../../domain/services/SportValidator.js';
import { SportDTO, UpdateSportRequest } from '@alentapp/shared';

describe('UpdateSportUseCase', () => {

    const mockSportRepository = {
        findById: vi.fn(),
        update: vi.fn()
    } as unknown as SportRepository

    const mockSportValidator = {
        validateAdditionalPrice: vi.fn(),
        validateMaxCapacity: vi.fn()
    } as unknown as SportValidator

    const useCase = new UpdateSportUseCase(mockSportRepository, mockSportValidator);

    const mockExistingSport: SportDTO = {
        id: 'uuid-1',
        name: 'Fútbol',
        description: 'Deporte de equipo jugado con una pelota',
        max_capacity: 22,
        additional_price: 0,
        requires_medical_certificate: false,
        created_at: '2026-04-20T00:00:00.000Z'
    }

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(mockSportRepository.findById).mockResolvedValue(mockExistingSport);
    })

    /*
        CASO DE EXITO
        Dado una solicitud de actualización de deporte
        Si los campos son válidos y el id del deporte existe
        Debe actualizarse el deporte solo de aquellos campos admisibles no nulos, que no son iguales y que fueron especificados
    */

    it('Los campos null no serán tomados en cuenta excepto description', async () => {
        const mockRequest: UpdateSportRequest = {
            description: null, // Lo tiene que tomar en cuenta
            max_capacity: 100,
            additional_price: 10,
            requires_medical_certificate: null // No lo tiene que tomar en cuenta
        }
        vi.mocked(mockSportRepository.update).mockResolvedValue({ ...mockExistingSport, ...mockRequest } as SportDTO)

        const result = await useCase.execute('uuid-1', mockRequest);

        expect(mockSportValidator.validateAdditionalPrice).toHaveBeenCalled()
        expect(mockSportValidator.validateMaxCapacity).toHaveBeenCalled()

        expect(mockSportRepository.update).toHaveBeenCalledWith('uuid-1', expect.objectContaining({
            description: null,
            max_capacity: 100,
            additional_price: 10,
        }))

    })

    it('Solo deben actualizarse los campos especificados', async () => {
        const mockRequest: UpdateSportRequest = {
            description: 'Deporte de fútbol 11',
            // max_capacity: 22, debería dejarlo igual
            additional_price: 10,
            requires_medical_certificate: false
        }
        vi.mocked(mockSportRepository.update).mockResolvedValue({ ...mockExistingSport, ...mockRequest } as SportDTO)

        const result = await useCase.execute('uuid-1', mockRequest);

        expect(mockSportValidator.validateAdditionalPrice).toHaveBeenCalled()
        expect(mockSportValidator.validateMaxCapacity).not.toHaveBeenCalled()

        expect(mockSportRepository.update).toHaveBeenCalledWith('uuid-1', expect.objectContaining({
            description: 'Deporte de fútbol 11',
            additional_price: 10,
            requires_medical_certificate: false
        }))

    })

    it('Los campos que son iguales no los debe tener en cuenta', async () => {
        const mockRequest: UpdateSportRequest = {
            description: 'Deporte de fútbol 11',
            max_capacity: 22, // No debería tenerlo en cuenta
            additional_price: 10,
            requires_medical_certificate: false
        }
        vi.mocked(mockSportRepository.update).mockResolvedValue({ ...mockExistingSport, ...mockRequest } as SportDTO)

        const result = await useCase.execute('uuid-1', mockRequest);

        expect(mockSportValidator.validateAdditionalPrice).toHaveBeenCalled()
        expect(mockSportValidator.validateMaxCapacity).not.toHaveBeenCalled()

        expect(mockSportRepository.update).toHaveBeenCalledWith('uuid-1', expect.objectContaining({
            description: 'Deporte de fútbol 11',
            additional_price: 10,
            requires_medical_certificate: false
        }))

    })

    it('Debe lanzar error si el deporte no existe', async () => {
        vi.mocked(mockSportRepository.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute('uuid-no', {})).rejects.toThrow('Deporte no encontrado: No existe deporte con ese id');
    })

    it('Debe lanzar error si se intenta modificar el nombre', async () => {
        const mockRequest: UpdateSportRequest = {
            name: 'Fútbol Modificado'
        }
        await expect(useCase.execute('uuid-1', mockRequest)).rejects.toThrow('Conflicto de solicitud: El nombre de un deporte registrado no puede ser modificado');
    })
})