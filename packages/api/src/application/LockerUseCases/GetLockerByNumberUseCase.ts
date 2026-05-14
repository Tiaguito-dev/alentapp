import { LockerDTO } from '@alentapp/shared';
import { LockerRepository } from '../../domain/LockerRepository.js';

export class GetLockerByNumberUseCase {
  constructor(private readonly lockerRepository: LockerRepository) {}

  async execute(number: number): Promise<LockerDTO> {
    const locker = await this.lockerRepository.findByNumber(number);
    
    if (!locker) {
      throw new Error('El casillero especificado no fue encontrado');
    }

    return locker;
  }
}