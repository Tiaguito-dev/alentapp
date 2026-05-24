import { describe, it, expect } from 'vitest';
import { LockerValidator } from './LockerValidator.js';
import { LockerDTO } from '@alentapp/shared';

describe('LockerValidator', () => {
    
    // Instancia única del validador para todos los bloques de prueba
    const validator = new LockerValidator();

    // =======================================================
    // VALIDACIONES AL CREAR
    // =======================================================
    describe('validateCreate', () => {
        it('debe permitir la creación si el estado inicial es Available (Camino Feliz)', () => {
            expect(() => validator.validateCreate('Available')).not.toThrow();
        });

        it('debe lanzar error si se intenta inicializar un casillero como Occupied', () => {
            expect(() => validator.validateCreate('Occupied'))
                .toThrow('error de validacion: El estado inicial debe ser Available');
        });

        it('debe lanzar error si se intenta inicializar un casillero como Maintenance', () => {
            expect(() => validator.validateCreate('Maintenance'))
                .toThrow('error de validacion: El estado inicial debe ser Available');
        });
    });

    // =======================================================
    // VALIDACIONES AL ACTUALIZAR 
    // =======================================================
    describe('validateUpdate', () => {
        
        // REGLA A: No asignar socios a casilleros en mantenimiento
        it('debe lanzar error si se asigna un socio a un casillero que ya está en Maintenance', () => {
            const currentLocker = { status: 'Maintenance', member_id: null } as LockerDTO;
            
            expect(() => validator.validateUpdate(currentLocker, undefined, 'socio-nuevo'))
                .toThrow('error: casillero en mantenimiento');
        });

        it('debe lanzar error si se asigna un socio y se pasa a Maintenance en la misma petición', () => {
            const currentLocker = { status: 'Available', member_id: null } as LockerDTO;
            
            expect(() => validator.validateUpdate(currentLocker, 'Maintenance', 'socio-nuevo'))
                .toThrow('error: casillero en mantenimiento');
        });

        // REGLA B: No mandar a mantenimiento si hay cosas adentro
        it('debe lanzar error si se pasa a Maintenance un casillero que ya tiene un socio', () => {
            const currentLocker = { status: 'Occupied', member_id: 'socio-existente' } as LockerDTO;
            
            expect(() => validator.validateUpdate(currentLocker, 'Maintenance', undefined))
                .toThrow('desasigne al socio primero');
        });

        // REGLA C: Protección contra sobreescritura 
        it('debe lanzar error si se intenta asignar a un socio pero el casillero ya lo tiene otro', () => {
            const currentLocker = { status: 'Occupied', member_id: 'socio-1' } as LockerDTO;
            
            expect(() => validator.validateUpdate(currentLocker, undefined, 'socio-2'))
                .toThrow('El casillero ya está asignado a otro socio. Desasígnelo primero.');
        });

        // CAMINOS FELICES (Happy Paths)
        it('debe permitir asignar un socio a un casillero Available', () => {
            const currentLocker = { status: 'Available', member_id: null } as LockerDTO;
            
            expect(() => validator.validateUpdate(currentLocker, 'Occupied', 'socio-1')).not.toThrow();
        });

        it('debe permitir pasar a Maintenance un casillero vacío', () => {
            const currentLocker = { status: 'Available', member_id: null } as LockerDTO;
            
            expect(() => validator.validateUpdate(currentLocker, 'Maintenance', undefined)).not.toThrow();
        });

        it('debe permitir desasignar a un socio (member_id null)', () => {
            const currentLocker = { status: 'Occupied', member_id: 'socio-1' } as LockerDTO;
            
            expect(() => validator.validateUpdate(currentLocker, 'Available', null)).not.toThrow();
        });
    });
});