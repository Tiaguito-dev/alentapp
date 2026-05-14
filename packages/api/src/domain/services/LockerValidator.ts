import { LockerDTO, LockerStatus } from '@alentapp/shared';

export class LockerValidator {
  
  // Reglas del TDD-0005: Validaciones al actualizar
  static validateUpdate(currentLocker: LockerDTO, newStatus?: LockerStatus, newMemberId?: string | null): void {
    
    // 1. Calculamos la "foto final"
    const finalStatus = newStatus !== undefined ? newStatus : currentLocker.status;
    const finalMemberId = newMemberId !== undefined ? newMemberId : currentLocker.member_id;

    // =======================================================
    // REGLA A: No asignar socios a casilleros en mantenimiento
    // =======================================================
    // Si están intentando meter un socio nuevo...
    if (newMemberId && newMemberId !== currentLocker.member_id) {
      // ...y el casillero YA ESTABA roto, o lo están ROMPIENDO en esta misma petición:
      if (currentLocker.status === 'Maintenance' || finalStatus === 'Maintenance') {
        throw new Error('error: casillero en mantenimiento');
      }
    }

    // =======================================================
    // REGLA B: No mandar a mantenimiento si hay cosas adentro
    // =======================================================
    // Si la foto final dice que va a estar en Mantenimiento y con un Socio adentro...
    if (finalStatus === 'Maintenance' && finalMemberId !== null && finalMemberId !== "") {
      // Y si antes NO estaba en mantenimiento (o sea, lo están rompiendo ahora):
      if (currentLocker.status !== 'Maintenance') {
        throw new Error('desasigne al socio primero');
      }
    }

    // =======================================================
    // REGLA C: Protección contra sobreescritura (Robo de casillero)
    // =======================================================
    if (newMemberId && currentLocker.member_id && currentLocker.member_id !== newMemberId) {
      throw new Error('El casillero ya está asignado a otro socio. Desasígnelo primero.');
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