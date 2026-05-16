import type { MedicalCertificateResponse, CreateMedicalCertificateRequest } from '@alentapp/shared';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/v1';

export const medicalCertificatesService = {
  async getAll(): Promise<MedicalCertificateResponse[]> {
    const response = await fetch(`${API_URL}/medical-certificates`);

    if (!response.ok) {
      throw new Error('Error al obtener certificados médicos');
    }

    const result = await response.json();
    return result.data || [];
  },

  async getById(id: string): Promise<MedicalCertificateResponse> {
    const response = await fetch(`${API_URL}/medical-certificates/${id}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error al obtener el certificado médico');
    }

    const result = await response.json();
    return result.data;
  },

  async create(data: CreateMedicalCertificateRequest): Promise<MedicalCertificateResponse> {
    const response = await fetch(`${API_URL}/medical-certificates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error al crear el certificado médico');
    }
    const result = await response.json();
    return result.data;
  },
};
