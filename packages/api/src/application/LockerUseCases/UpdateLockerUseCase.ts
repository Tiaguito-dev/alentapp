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
    // REGLA 1: Relación 1 a 1 (Requiere Base de Datos)
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
    // REGLA 2: Cambio de estado automático
    // ==========================================
    // Si asignamos un socio (viene ID) y no mandamos un estado a mano, pasa a Occupied
    if (data.member_id && data.status === undefined) {
      data.status = 'Occupied';
    }

    // Si desasignamos al socio mandando null, y no mandamos estado a mano, vuelve a Available
    if (data.member_id === null && data.status === undefined) {
      data.status = 'Available';
    }

    // 3. Validamos las demás reglas de negocio pura (Mantenimiento, reasignación, etc)
    // Delegamos toda la lógica al validador para no ensuciar el UseCase
    LockerValidator.validateUpdate(currentLocker, data.status, data.member_id);

    // 4. Si todo está bien, actualizamos
    return this.lockerRepository.update(number, data);
  }
}