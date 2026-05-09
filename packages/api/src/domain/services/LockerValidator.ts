import { LockerDTO, LockerStatus } from '@alentapp/shared';

export class LockerValidator {
  
  // Reglas del TDD-0005: Validaciones al actualizar
  static validateUpdate(currentLocker: LockerDTO, newStatus?: LockerStatus, newMemberId?: string | null): void {
    
    // 1. Regla crítica: Un casillero no puede asignarse si su status es "Maintenance"
    if (newMemberId && (newStatus === 'Maintenance' || currentLocker.status === 'Maintenance')) {
      throw new Error('error: casillero en mantenimiento');
    }

    // 2. Protección contra Sobreescritura: Si ya está asignado a otro socio
    if (newMemberId && currentLocker.member_id && currentLocker.member_id !== newMemberId) {
      throw new Error('El casillero ya está asignado a otro socio. Desasígnelo primero.');
    }

    // 3. Transición a Mantenimiento: No pasar a mantenimiento si está ocupado
    if (newStatus === 'Maintenance' && currentLocker.member_id && newMemberId !== null) {
      throw new Error('No se puede poner en mantenimiento un casillero ocupado. Reasigne al socio primero.');
    }
  }

  // Reglas del TDD-0006: Validaciones al eliminar
  static validateDelete(currentLocker: LockerDTO): void {
    // Por razones de integridad, impedir eliminación si está ocupado
    if (currentLocker.member_id !== null) {
      throw new Error('No se puede eliminar un casillero ocupado por un socio');
    }
  }
 // Regla del TDD-0004: Validaciones al crear
  static validateCreate(status: LockerStatus): void {
    if (status !== 'Available') {
      // El TDD dice que el estado inicial debe ser Available
      throw new Error('error de validacion: El estado inicial debe ser Available');
    }
  }


}