import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateDisciplineUseCase } from './UpdateDisciplineUseCase.js';
import { DisciplineValidator } from '../../domain/services/DisciplineValidator.js';
import { UpdateDisciplineRequest } from '@alentapp/shared';

describe('UpdateDisciplineUseCase', () => {
    
    const mockDisciplineRepo = {
        findById: vi.fn(),
        update: vi.fn(),
    };

    
    const mockDisciplineValidator = {
        validateUpdate: vi.fn(),
        validateName: vi.fn(),
        validateDates: vi.fn(),
    } as unknown as DisciplineValidator;

    const useCase = new UpdateDisciplineUseCase(mockDisciplineRepo as any, mockDisciplineValidator);

    const mockExistingDiscipline = {
        id: 'uuid-disciplina-1',
        name: 'Fútbol',
        start_date: '2026-06-01T20:00:00.000Z',
        end_date: '2026-12-31T22:00:00.000Z',
        is_total_suspension: false,
        member_id: 'socio-123'
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    
    it('debe invocar al DisciplineValidator para validar antes de actualizar', async () => {
        vi.mocked(mockDisciplineRepo.findById).mockResolvedValueOnce(mockExistingDiscipline);
        vi.mocked(mockDisciplineRepo.update).mockResolvedValueOnce({ ...mockExistingDiscipline, end_date: '2027-01-01T00:00:00.000Z' });

        
        vi.mocked(mockDisciplineValidator.validateUpdate).mockReturnValueOnce(undefined);

        const payload: UpdateDisciplineRequest = { 
            end_date: '2027-01-01T00:00:00.000Z'
        };

        await useCase.execute('uuid-disciplina-1', payload);

        
        expect(mockDisciplineValidator.validateUpdate).toHaveBeenCalled();
    });

    it('debe frenar la ejecución si el DisciplineValidator falla', async () => {
        vi.mocked(mockDisciplineRepo.findById).mockResolvedValueOnce(mockExistingDiscipline);

        
        vi.mocked(mockDisciplineValidator.validateUpdate).mockImplementationOnce(() => {
            throw new Error('La fecha de fin debe ser mayor a la de inicio');
        });

        const payload: UpdateDisciplineRequest = { end_date: '2025-01-01T00:00:00.000Z' };

        await expect(useCase.execute('uuid-disciplina-1', payload))
            .rejects.toThrow('La fecha de fin debe ser mayor a la de inicio');
            
        expect(mockDisciplineRepo.update).not.toHaveBeenCalled();
    });

    it('debe actualizar correctamente y guardar en BD si todo es válido', async () => {
        vi.mocked(mockDisciplineRepo.findById).mockResolvedValueOnce(mockExistingDiscipline);
        
        
        vi.mocked(mockDisciplineValidator.validateUpdate).mockReturnValueOnce(undefined);
        vi.mocked(mockDisciplineRepo.update).mockResolvedValueOnce({} as any);

        const payload: UpdateDisciplineRequest = { is_total_suspension: true };

        await useCase.execute('uuid-disciplina-1', payload);

        expect(mockDisciplineRepo.update).toHaveBeenCalledWith('uuid-disciplina-1', expect.objectContaining({
            is_total_suspension: true
        }));
    });
});