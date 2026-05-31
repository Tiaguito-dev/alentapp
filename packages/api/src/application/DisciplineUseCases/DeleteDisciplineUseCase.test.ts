import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteDisciplineUseCase } from './DeleteDisciplineUseCase.js';
import { DisciplineRepository } from '../../domain/DisciplineRepository.js';
import { DisciplineDTO } from '@alentapp/shared';

describe('DeleteDisciplineUseCase', () => {
    
    
    const mockDisciplineRepo = {
        findById: vi.fn(),
        delete: vi.fn(), 
    } as unknown as DisciplineRepository;

    
    const useCase = new DeleteDisciplineUseCase(mockDisciplineRepo);

    
    const mockExistingDiscipline: DisciplineDTO = {
        id: 'uuid-disc-1',
        name: 'Fútbol Senior',
        description: 'Torneo nocturno',
        start_date: '2026-06-01T20:00:00.000Z',
        end_date: '2026-12-31T22:00:00.000Z',
        is_total_suspension: false,
        member_id: 'uuid-member-1',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe eliminar la disciplina correctamente si existe', async () => {
        
        vi.mocked(mockDisciplineRepo.findById).mockResolvedValueOnce(mockExistingDiscipline as any);
        
        
        vi.mocked(mockDisciplineRepo.delete).mockResolvedValueOnce(undefined);

        await useCase.execute('uuid-disc-1');

        expect(mockDisciplineRepo.delete).toHaveBeenCalledTimes(1);
        expect(mockDisciplineRepo.delete).toHaveBeenCalledWith('uuid-disc-1');
    });

    it('debe lanzar error si la disciplina no existe', async () => {
        
        vi.mocked(mockDisciplineRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute('uuid-disc-1'))
            
            .rejects.toThrow(/no existe/i); 
            
        expect(mockDisciplineRepo.delete).not.toHaveBeenCalled();
    });
});