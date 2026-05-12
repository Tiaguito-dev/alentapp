import { UpdateLockerRequest, LockerDTO } from '@alentapp/shared';
import { LockerRepository } from '../../domain/LockerRepository.js';
import { LockerValidator } from '../../domain/services/LockerValidator.js';

export class UpdateLockerUseCase {
  constructor(private readonly lockerRepository: LockerRepository) {}

  async execute(number: number, data: UpdateLockerRequest): Promise<LockerDTO> {
    // 1. Buscamos el casillero actual
    const currentLocker = await this.lockerRepository.findByNumber(number);
    
    if (!currentLocker) {
      throw new Error('El casillero especificado no fue encontrado');
    }
    
    if (data.member_id) {
      // ...buscamos si ya existe algún casillero con ese socio
      const existingLockerForMember = await this.lockerRepository.findByMemberId(data.member_id);
      
      // Si existe un casillero para este socio Y NO es el casillero que estamos editando ahora mismo...
      if (existingLockerForMember && existingLockerForMember.number !== number) {
        // Lanzamos un error (HTTP 400 Bad Request o un Custom Error de Dominio)
        throw new Error("Este socio ya tiene un casillero asignado. Relación 1 a 1 violada.");
      } }
    // 2. Validamos las reglas de negocio (Mantenimiento, reasignación, etc)
    LockerValidator.validateUpdate(currentLocker, data.status, data.member_id);

    // 3. Si todo está bien, actualizamos
    // Nota de diseño: Si el member_id no existe, la base de datos lanzará un error de Foreign Key 
    // que capturaremos en el controlador para devolver el 404 del TDD.
    return this.lockerRepository.update(number, data);
  }
}