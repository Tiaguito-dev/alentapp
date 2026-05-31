import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SportValidator } from './SportValidator.js';
import { SportRepository } from '../SportRepository.js';
import { SportDTO } from '@alentapp/shared';

describe('SportValidator', () => {
    // La única dependencia que tiene SportValidator es Sport repository
    const mockSportRepository = {
        findByName: vi.fn(),
    } as unknown as SportRepository;

    const validator = new SportValidator(mockSportRepository);

    beforeEach(() => {
        vi.clearAllMocks();
    })

    describe('Validador de dominio SportValidator', () => {

        const mockSportDTO: SportDTO = {
            id: 'UUID-01',
            name: 'Tenis',
            description: 'Individual en cancha de ladrillo',
            max_capacity: 100,
            additional_price: 0,
            requires_medical_certificate: true,
            created_at: (new Date()).toISOString(),
        }


        describe('Funcionalidad: Validar unicidad del nombre del deporte', () => {
            /*
                Dado un nombre de deporte
                Si existe un deporte con ese nombre
                Debe lanzar error
                Sino debe pasar
            */

            it('debe lanzar error si el nombre ya existe', async () => {
                const sportName = 'Tenis';
                vi.mocked(mockSportRepository.findByName).mockResolvedValue(mockSportDTO);

                // rejects para async
                await expect(validator.validateUniqueName(sportName)).rejects.toThrow('Nombre inválido: Ya existe un deporte con ese nombre');
                // Espero que se haya llamado con ese nombre del deporte, y una sola vez
                expect(mockSportRepository.findByName).toHaveBeenCalledWith(sportName);
                expect(mockSportRepository.findByName).toHaveBeenCalledOnce();


            })

            it('debe continuar con el flujo si el nombre es único', async () => {
                const sportName = 'Tenis';
                vi.mocked(mockSportRepository.findByName).mockResolvedValue(null);

                await expect(validator.validateUniqueName(sportName)).resolves.not.toThrow();
                expect(mockSportRepository.findByName).toHaveBeenCalledWith(sportName);
                expect(mockSportRepository.findByName).toHaveBeenCalledOnce();
            })

        })

        describe('Funcionalidad: Validar precio adicional', () => {
            /*
            Dado un precio adicional
            Si es menor a 0
            Debe lanzar error
            */
            it('debe lanzar error si el precio adicional es menor a 0', () => {
                const additionalPrice = -10;
                // Le paso la funcion directamente cuando es sync para que la evalue
                expect(() =>
                    validator.validateAdditionalPrice(additionalPrice)).toThrow('Número inválido: El precio adicional no puede ser negativo');
            })

            it('debe continuar con el flujo si el precio adicional es mayor o igual a 0', () => {
                const additionalPrice = 0;
                expect(() =>
                    validator.validateAdditionalPrice(additionalPrice)).not.toThrow();
            })
        })

        describe('Funcionalidad: Validar capacidad maxima', () => {
            /*
            Dado una capacidad maxima
            Si es menor a 0
            Debe lanzar error
            */
            it('debe lanzar error si la capacidad maxima es menor a 0', () => {
                const maxCapacity = -10;
                expect(() =>
                    validator.validateMaxCapacity(maxCapacity)).toThrow('Número inválido: La capacidad maxima debe ser mayor a cero');
            })

            it('debe lanzar error si la capacidad maxima es 0', () => {
                const maxCapacity = 0;
                expect(() =>
                    validator.validateMaxCapacity(maxCapacity)).toThrow('Número inválido: La capacidad maxima debe ser mayor a cero');
            })

            it('debe lanzar error si la capacidad maxima no es un numero entero', () => {
                const maxCapacity = 10.5;
                expect(() =>
                    validator.validateMaxCapacity(maxCapacity)).toThrow('Número inválido: La capacidad maxima debe ser un número entero');
            })

            it('debe continuar con el flujo si la capacidad maxima es mayor a 0 y es un numero entero', () => {
                const maxCapacity = 10;
                expect(() =>
                    validator.validateMaxCapacity(maxCapacity)).not.toThrow();
            })
        })

    })

})