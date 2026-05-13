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
    
    // ==========================================
    // REGLA 1: Relación 1 a 1
    // ==========================================
    if (data.member_id) {
      // buscamos si ya existe algún casillero con ese socio
      const existingLockerForMember = await this.lockerRepository.findByMemberId(data.member_id);
      
      // Si existe un casillero para este socio Y NO es el casillero que estamos editando ahora mismo...
      if (existingLockerForMember && existingLockerForMember.number !== number) {
        throw new Error("ya tiene un casillero asignado");
      } 
    }

    // ==========================================
    // REGLA 2: Mantenimiento sin socio
    // ==========================================
    // Calculamos cómo va a quedar el casillero si aplicamos los cambios
   const finalMemberId = data.member_id !== undefined ? data.member_id : currentLocker.member_id;
    const finalStatus = data.status !== undefined ? data.status : currentLocker.status;

    if (finalStatus === 'Maintenance' && finalMemberId !== null && finalMemberId !== "") {
      
      if (currentLocker.status === 'Maintenance') {
        // Escenario A (422): El casillero YA estaba roto y le querés asignar a alguien
        throw new Error("error: casillero en mantenimiento");
      } else {
        // Escenario B (409): El casillero estaba ocupado y lo querés romper sin sacar al socio
        throw new Error("No se puede poner en mantenimiento un casillero asignado. Desasigne al socio primero.");
      }
      
    }

    // 2. Validamos las demás reglas de negocio (Mantenimiento, reasignación, etc)
    LockerValidator.validateUpdate(currentLocker, data.status, data.member_id);

    // 3. Si todo está bien, actualizamos
    // que capturaremos en el controlador para devolver el 404 del TDD.
    return this.lockerRepository.update(number, data);
  }
}