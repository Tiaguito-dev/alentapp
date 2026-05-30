import { describe, it, expect } from 'vitest';
import { DisciplineValidator } from './DisciplineValidator.js';
import { DisciplineDTO } from '@alentapp/shared'; 

describe('DisciplineValidator', () => {
    
    
    const validator = new DisciplineValidator();

    
    describe('validateCreate', () => {
        
        
        it('debe permitir la creación si el nombre es válido (Camino Feliz)', () => {
            expect(() => validator.validateName('Fútbol Senior')).not.toThrow();
        });

        
        it('debe lanzar error si el nombre es un string vacío', () => {
            expect(() => validator.validateName(''))
                .toThrow('El nombre es obligatorio');
        });
    });

    
    describe('validateUpdate', () => {

        
        it('debe pasar la validación si la fecha de fin es estrictamente posterior a la de inicio', () => {
            const startDate = '2026-06-01T20:00:00.000Z';
            const endDate = '2026-12-31T22:00:00.000Z';
            
            expect(() => validator.validateDates(startDate, endDate)).not.toThrow();
        });

        it('debe lanzar error si la fecha de fin es anterior a la de inicio', () => {
            const startDate = '2026-06-01T20:00:00.000Z';
            const endDate = '2025-01-01T20:00:00.000Z'; 
            
            expect(() => validator.validateDates(startDate, endDate))
                .toThrow('La fecha de fin debe ser mayor a la de inicio');
        });

        it('debe lanzar error si la fecha de inicio y fin son exactamente iguales', () => {
            const sameDate = '2026-06-01T20:00:00.000Z';
            
            expect(() => validator.validateDates(sameDate, sameDate))
                .toThrow('La fecha de fin debe ser mayor a la de inicio');
        });

        
        it('debe lanzar error si el formato de la fecha de inicio es inválido', () => {
            const startDate = 'esto-no-es-una-fecha';
            const endDate = '2026-12-31T22:00:00.000Z';
            
            expect(() => validator.validateDates(startDate, endDate))
                .toThrow(/Formato de fecha inválido|La fecha de fin debe ser mayor a la de inicio/);
        });

        it('debe lanzar error si el formato de la fecha de fin es inválido', () => {
            const startDate = '2026-06-01T20:00:00.000Z';
            const endDate = 'fecha-invalida-123';
            
            expect(() => validator.validateDates(startDate, endDate))
                .toThrow(/Formato de fecha inválido|La fecha de fin debe ser mayor a la de inicio/);
        });
    });
});