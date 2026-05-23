import { describe, it, expect } from 'vitest';
import { PaymentValidator } from './PaymentValidator.js';

describe('PaymentValidator', () => {
    const validator = new PaymentValidator();

    describe('validateAmount', () => {
        it('debe lanzar error si el monto es 0', () => {
            expect(() => validator.validateAmount(0)).toThrow('El monto debe ser mayor a cero');
        });

        it('debe lanzar error si el monto es negativo', () => {
            expect(() => validator.validateAmount(-50)).toThrow('El monto debe ser mayor a cero');
        });
    });

    describe('validatePeriod', () => {
        it('debe lanzar error si el mes es menor a 1', () => {
            expect(() => validator.validatePeriod(0, 2026)).toThrow('El mes debe estar entre 1 y 12');
        });

        it('debe lanzar error si el mes es mayor a 12', () => {
            expect(() => validator.validatePeriod(13, 2026)).toThrow('El mes debe estar entre 1 y 12');
        });

        it('debe lanzar error si el año está fuera del rango razonable', () => {
            expect(() => validator.validatePeriod(5, 2000)).toThrow(/El año debe estar entre/);
        });
    });

    describe('validateDueDate', () => {
        it('debe lanzar error con formato de fecha inválido', () => {
            expect(() => validator.validateDueDate('31/12/2026')).toThrow('Formato de fecha inválido (esperado YYYY-MM-DD)');
        });

        it('debe pasar con una fecha en formato YYYY-MM-DD válido', () => {
            expect(() => validator.validateDueDate('2026-05-31')).not.toThrow();
        });
    });

    describe('validatePaymentDate', () => {
        it('debe lanzar error con formato de fecha y hora inválido', () => {
            expect(() => validator.validatePaymentDate('2026-05-31')).toThrow('Formato de fecha y hora inválido');
            expect(() => validator.validatePaymentDate('no-es-una-fecha')).toThrow('Formato de fecha y hora inválido');
        });

        it('debe pasar con un formato ISO datetime válido', () => {
            expect(() => validator.validatePaymentDate('2026-05-15T10:00:00.000Z')).not.toThrow();
        });
    });
});