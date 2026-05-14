import { LockerRepository } from '../../domain/LockerRepository.js';
import { LockerValidator } from '../../domain/services/LockerValidator.js';

export class DeleteLockerUseCase {
  constructor(private readonly lockerRepository: LockerRepository) {}

  async execute(number: number): Promise<void> {
    // 1. Buscamos el casillero
    const currentLocker = await this.lockerRepository.findByNumber(number);
    
    if (!currentLocker) {
      throw new Error('El casillero especificado no fue encontrado');
    }

    // 2. Validamos que se pueda borrar (que no tenga socio)
    LockerValidator.validateDelete(currentLocker);

    // 3. Lo eliminamos
    await this.lockerRepository.delete(number);
  }
}