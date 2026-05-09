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

    // 2. Validamos las reglas de negocio (Mantenimiento, reasignación, etc)
    LockerValidator.validateUpdate(currentLocker, data.status, data.member_id);

    // 3. Si todo está bien, actualizamos
    // Nota de diseño: Si el member_id no existe, la base de datos lanzará un error de Foreign Key 
    // que capturaremos en el controlador para devolver el 404 del TDD.
    return this.lockerRepository.update(number, data);
  }
}