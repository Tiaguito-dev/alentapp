import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateDisciplineUseCase } from './CreateDisciplineUseCase.js'; 
import { DisciplineRepository } from '../../domain/DisciplineRepository.js';
import { DisciplineValidator } from '../../domain/services/DisciplineValidator.js';
import { CreateDisciplineRequest, DisciplineDTO } from '@alentapp/shared';

describe('CreateDisciplineUseCase', () => {
    
    const mockDisciplineRepo = {
        create: vi.fn(),
    } as unknown as DisciplineRepository;

    const mockDisciplineValidator = {
        validateName: vi.fn(),
        validateDates: vi.fn(), 
    } as unknown as DisciplineValidator;

    const useCase = new CreateDisciplineUseCase(mockDisciplineRepo, mockDisciplineValidator);

    const mockRequest: CreateDisciplineRequest = {
        name: 'Fútbol Senior',
        description: 'Torneo nocturno',
        start_date: '2026-06-01T20:00:00.000Z',
        end_date: '2026-12-31T22:00:00.000Z',
        member_id: 'a3538761-de0c-4416-a963-020fb594dc29'
    };

    const mockCreatedDiscipline: DisciplineDTO = {
        id: 'uuid-1',
        ...mockRequest,
        description: mockRequest.description ?? null,
        is_total_suspension: false
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe invocar al DisciplineValidator para validar el nombre y las fechas', async () => {
        vi.mocked(mockDisciplineValidator.validateName).mockReturnValueOnce(undefined);
        vi.mocked(mockDisciplineValidator.validateDates).mockReturnValueOnce(undefined); 
        vi.mocked(mockDisciplineRepo.create).mockResolvedValueOnce(mockCreatedDiscipline as any);

        await useCase.execute(mockRequest);

        expect(mockDisciplineValidator.validateName).toHaveBeenCalledTimes(1);
        expect(mockDisciplineValidator.validateName).toHaveBeenCalledWith(mockRequest.name);

        expect(mockDisciplineValidator.validateDates).toHaveBeenCalledTimes(1); 
        expect(mockDisciplineValidator.validateDates).toHaveBeenCalledWith(
            mockRequest.start_date, 
            mockRequest.end_date
        );
    });

    it('debe frenar la ejecución si el validador falla por el nombre', async () => {
        vi.mocked(mockDisciplineValidator.validateName).mockImplementationOnce(() => {
            throw new Error('error de validacion: El nombre no puede estar vacío');
        });

        await expect(useCase.execute({ ...mockRequest, name: '' }))
            .rejects.toThrow('error de validacion: El nombre no puede estar vacío');

        expect(mockDisciplineValidator.validateDates).not.toHaveBeenCalled(); 
        expect(mockDisciplineRepo.create).not.toHaveBeenCalled();
    });

    it('debe frenar la ejecución si el validador falla por las fechas', async () => {
        vi.mocked(mockDisciplineValidator.validateName).mockReturnValueOnce(undefined);
        vi.mocked(mockDisciplineValidator.validateDates).mockImplementationOnce(() => { 
            throw new Error('error de validacion: La fecha de fin debe ser posterior a la de inicio');
        });

        const badRequest = { ...mockRequest, end_date: '2025-01-01T00:00:00.000Z' };

        await expect(useCase.execute(badRequest))
            .rejects.toThrow('error de validacion: La fecha de fin debe ser posterior a la de inicio');

        expect(mockDisciplineRepo.create).not.toHaveBeenCalled();
    });

    it('debe crear la disciplina exitosamente si pasa las validaciones', async () => {
        vi.mocked(mockDisciplineValidator.validateName).mockReturnValueOnce(undefined);
        vi.mocked(mockDisciplineValidator.validateDates).mockReturnValueOnce(undefined);
        vi.mocked(mockDisciplineRepo.create).mockResolvedValueOnce(mockCreatedDiscipline as any);

        const result = await useCase.execute(mockRequest);

        
        expect(mockDisciplineRepo.create).toHaveBeenCalledTimes(1);
        expect(mockDisciplineRepo.create).toHaveBeenCalledWith(expect.objectContaining({
            ...mockRequest
        }));
        
        
        expect(result).toEqual(mockCreatedDiscipline);
    });
});