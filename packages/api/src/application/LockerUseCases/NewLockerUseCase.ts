import { LockerRepository } from '../../domain/LockerRepository.js';
import { LockerValidator } from '../../domain/services/LockerValidator.js';
import { CreateLockerRequest, LockerDTO } from '@alentapp/shared';

export class CreateLockerUseCase {
  constructor(private readonly lockerRepository: LockerRepository) {}

  async execute(data: CreateLockerRequest): Promise<LockerDTO> {
    
    // verifico que el estado inicial sea available
    LockerValidator.validateCreate(data.status);

    //  Verificamos si ya existe un casillero con ese número
    const existingLocker = await this.lockerRepository.findByNumber(data.number);
    
    if (existingLocker) {
      // Mensaje exacto del TDD-0004 para el Error 409
      throw new Error('Ya existe Casillero con ese numero'); 
    }

    //  Si no existe, lo creamos
    return this.lockerRepository.create(data);
  }
}