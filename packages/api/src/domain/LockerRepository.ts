import { 
  CreateLockerRequest, 
  UpdateLockerRequest, 
  LockerDTO 
} from '@alentapp/shared';

export interface LockerRepository {

  
  findByMemberId(memberId: string): Promise<LockerDTO | null>;
  
  create(data: CreateLockerRequest): Promise<LockerDTO>;
  
  update(number: number, data: UpdateLockerRequest): Promise<LockerDTO>;
  
  delete(number: number): Promise<void>;
  
  findByNumber(number: number): Promise<LockerDTO | null>;
  
  findAll(): Promise<LockerDTO[]>;
}