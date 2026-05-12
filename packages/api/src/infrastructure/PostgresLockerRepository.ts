import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js'; 
import { LockerRepository } from '../domain/LockerRepository.js'; 
import { LockerDTO, CreateLockerRequest, UpdateLockerRequest, LockerStatus } from '@alentapp/shared';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});

// Tipo local que representa exactamente lo que devuelve Prisma
type DBLocker = {
    id: string;
    number: number;
    location: string;
    status: 'Available' | 'Occupied' | 'Maintenance';
    member_id: string | null;
};

export class PostgresLockerRepository implements LockerRepository {
    
    async create(data: CreateLockerRequest): Promise<LockerDTO> {
        const locker = await prisma.locker.create({
            data: {
                number: data.number,
                location: data.location,
                status: data.status,
            },
        });

        return this.mapToDTO(locker);
    }

    async findByNumber(number: number): Promise<LockerDTO | null> {
        const locker = await prisma.locker.findUnique({
            where: { number },
        });

        return locker ? this.mapToDTO(locker) : null;
    }

    async findAll(): Promise<LockerDTO[]> {
        const lockers = await prisma.locker.findMany({
            orderBy: { number: 'asc' }, // Ordenamos por número para que sea más prolijo
        });

        return lockers.map(this.mapToDTO);
    }

    async update(number: number, data: UpdateLockerRequest): Promise<LockerDTO> {
        const locker = await prisma.locker.update({
            where: { number },
            data: {
                // Si el dato viene en el request, lo actualizamos. 
                // Nota: para member_id chequeamos !== undefined porque puede venir en null (para desasignar)
                ...(data.location && { location: data.location }),
                ...(data.status && { status: data.status }),
                ...(data.member_id !== undefined && { member_id: data.member_id }),
            },
        });

        return this.mapToDTO(locker);
    }

    async delete(number: number): Promise<void> {
        await prisma.locker.delete({
            where: { number },
        });
    }

    // El Mapper: Transforma el objeto de Prisma al DTO compartido
    private mapToDTO(locker: DBLocker): LockerDTO {
        return {
            id: locker.id,
            number: locker.number,
            location: locker.location,
            status: locker.status,
            member_id: locker.member_id,
        };
    }
    // En tu PostgresLockerRepository.ts
  async findByMemberId(memberId: string): Promise<LockerDTO | null> {
    // Usamos findFirst porque esperamos que, como máximo, haya uno
    const lockerRecord = await prisma.locker.findFirst({
      where: { member_id: memberId },
    });

    if (!lockerRecord) return null;
    
    // Mapeamos el registro de Prisma al formato exacto de tu LockerDTO
    return {
      id: lockerRecord.id,
      number: lockerRecord.number,
      location: lockerRecord.location,
      status: lockerRecord.status as LockerStatus, // Si usás un enum o type específico para el status
      member_id: lockerRecord.member_id
    };
  }
}