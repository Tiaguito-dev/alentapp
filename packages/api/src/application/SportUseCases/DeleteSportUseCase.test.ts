import { vi, beforeEach, describe, it, expect } from 'vitest';
import { DeleteSportUseCase } from './DeleteSportUseCase.js';
import { SportRepository } from '../../domain/SportRepository.js';

describe('DeleteSportUseCase', () => {

    const mockSportRepository = {
        findById: vi.fn(),
        isDeleted: vi.fn(),
        delete: vi.fn(),
    } as unknown as SportRepository;

    const useCase = new DeleteSportUseCase(mockSportRepository);

    beforeEach(() => {
        vi.clearAllMocks();
    })

    it('debe lanzar error si el deporte no existe', async () => {
        vi.mocked(mockSportRepository.findById).mockResolvedValueOnce(null);
        await expect(useCase.execute('uuid-999')).rejects.toThrow('Deporte no encontrado');
        expect(mockSportRepository.delete).not.toHaveBeenCalled();
    })

    it('debe eliminar el deporte si existe', async () => {
        vi.mocked(mockSportRepository.findById).mockResolvedValueOnce({ id: 'uuid-1' } as any);
        await useCase.execute('uuid-1');
        expect(mockSportRepository.isDeleted).toHaveBeenCalledWith('uuid-1');
        expect(mockSportRepository.delete).toHaveBeenCalledWith('uuid-1');
    })

    it('debe retornar error si el deporte ya está eliminado', async () => {
        vi.mocked(mockSportRepository.findById).mockResolvedValueOnce({ id: 'uuid-1' } as any);
        vi.mocked(mockSportRepository.isDeleted).mockResolvedValueOnce(true);
        await expect(useCase.execute('uuid-1')).rejects.toThrow('Conflicto de solicitud: El deporte ya está dado de baja');
        expect(mockSportRepository.delete).not.toHaveBeenCalled();
    })
})