import type { LockerDTO, CreateLockerRequest, UpdateLockerRequest } from '@alentapp/shared';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/v1';

export const lockersService = {
  async getAll(): Promise<LockerDTO[]> {
    const response = await fetch(`${API_URL}/lockers`);
    if (!response.ok) {
      throw new Error('Error al obtener los casilleros');
    }
    const result = await response.json();
    // Dependiendo de si tu backend envuelve la respuesta en un objeto "data" o no
    return result.data || result; 
  },

  async create(data: CreateLockerRequest): Promise<LockerDTO> {
    const response = await fetch(`${API_URL}/lockers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al crear el casillero');
    }
    const result = await response.json();
    return result.data || result;
  },

  async update(number: number, data: UpdateLockerRequest): Promise<LockerDTO> {
    const response = await fetch(`${API_URL}/lockers/${number}`, {
      method: 'PATCH', // TDD-0005 usa PATCH
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al actualizar el casillero');
    }
    const result = await response.json();
    return result.data || result;
  },

  async delete(number: number): Promise<void> {
    const response = await fetch(`${API_URL}/lockers/${number}`, {
      method: 'DELETE',
    });
    // El TDD-0006 devuelve 204 No Content, por lo que podría no haber body JSON
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error al eliminar el casillero');
    }
  },
};