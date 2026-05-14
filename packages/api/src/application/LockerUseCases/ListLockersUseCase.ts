import { LockerDTO } from '@alentapp/shared';
import { LockerRepository } from '../../domain/LockerRepository.js';

export class ListLockersUseCase {
  constructor(private readonly lockerRepository: LockerRepository) {}

  async execute(): Promise<LockerDTO[]> {
    return this.lockerRepository.findAll();
  }
}