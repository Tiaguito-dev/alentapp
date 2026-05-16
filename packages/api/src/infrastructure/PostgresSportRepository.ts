import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { SportRepository } from '../domain/SportRepository.js';
import { SportDTO, CreateSportRequest } from '@alentapp/shared';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});

type DBSport = {
    id: string;
    name: string;
    description: string | null;
    additional_price: number;
    max_capacity: number;
    requires_medical_certificate: boolean;
    created_at: Date;
    deleted_at: Date | null;
};

export class PostgresSportRepository implements SportRepository {
    async create(data: CreateSportRequest): Promise<SportDTO> {

        // En caso de que el deporte no tenga descripción, se le asigna null
        const description = data.description ?? null;

        // En caso de que el deporte no tenga precio adicional, se le asigna 0
        const additional_price = data.additional_price ?? 0;

        const sport = await prisma.sport.create({
            data: {
                name: data.name,
                description: description,
                max_capacity: data.max_capacity,
                additional_price: additional_price,
                requires_medical_certificate: data.requires_medical_certificate,
                deleted_at: null,
            },
        });

        return this.mapToDTO(sport);
    }

    async findByName(name: string): Promise<SportDTO | null> {
        const sport = await prisma.sport.findUnique({
            where: { name },
        });

        if (sport && sport.deleted_at !== null) {
            return null;
        }

        return sport ? this.mapToDTO(sport) : null;
    }

    private mapToDTO(sport: DBSport): SportDTO {
        return {
            id: sport.id,
            name: sport.name,
            description: sport.description,
            max_capacity: sport.max_capacity,
            additional_price: sport.additional_price,
            requires_medical_certificate: sport.requires_medical_certificate,
            created_at: sport.created_at.toISOString(),
        };
    }
}