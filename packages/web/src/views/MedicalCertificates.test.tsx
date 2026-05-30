import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MedicalCertificatesView } from './MedicalCertificates';
import { medicalCertificatesService } from '../services/medicalCertificates';
import { membersService } from '../services/members';
import { Provider } from '../components/ui/provider';
import type { MedicalCertificateResponse, MemberDTO } from '@alentapp/shared';

vi.mock('../services/medicalCertificates', () => ({
  medicalCertificatesService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    invalidate: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../services/members', () => ({
  membersService: {
    getAll: vi.fn(),
  },
}));

describe('MedicalCertificatesView - Integración de UI', () => {
  const renderWithProviders = (ui: React.ReactElement) => {
    return render(<Provider>{ui}</Provider>);
  };

  const mockMembers: MemberDTO[] = [
    { id: 'member-1', name: 'Juan Perez', dni: '12345678', email: 'juan@test.com', birthdate: '1990-01-01', category: 'Pleno', status: 'Activo', created_at: new Date().toISOString() },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe mostrar el estado de carga y luego renderizar lista vacía', async () => {
    vi.mocked(medicalCertificatesService.getAll).mockResolvedValueOnce([]);
    vi.mocked(membersService.getAll).mockResolvedValueOnce(mockMembers);

    renderWithProviders(<MedicalCertificatesView />);

    expect(screen.getByText('Cargando certificados médicos...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Cargando certificados médicos...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('No se encontraron certificados médicos.')).toBeInTheDocument();
  });

  it('debe crear un certificado médico y mostrarlo en la lista', async () => {
    vi.mocked(medicalCertificatesService.getAll).mockResolvedValue([]);
    vi.mocked(membersService.getAll).mockResolvedValue(mockMembers);
    renderWithProviders(<MedicalCertificatesView />);
    await waitFor(() => expect(screen.queryByText('Cargando certificados médicos...')).not.toBeInTheDocument());

    // Abrir modal de creación
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Nuevo Certificado/i }));
    expect(screen.getByText('Nuevo Certificado Médico')).toBeInTheDocument();

    // Llenar formulario
    await user.selectOptions(screen.getByLabelText('Socio'), ['member-1']);
    await user.type(screen.getByLabelText('Fecha de emisión'), '2026-05-01');
    await user.type(screen.getByLabelText('Fecha de vencimiento'), '2027-05-01');
    await user.type(screen.getByLabelText('Matrícula del médico'), '12345');

    // Mock creación exitosa
    vi.mocked(medicalCertificatesService.create).mockResolvedValueOnce({
      id: 'cert-1',
      member_id: 'member-1',
      issue_date: '2026-05-01',
      expiry_date: '2027-05-01',
      doctor_license: '12345',
      is_validated: true,
      created_at: new Date().toISOString(),
    } as MedicalCertificateResponse);
    vi.mocked(medicalCertificatesService.getAll).mockResolvedValueOnce([
      {
        id: 'cert-1',
        member_id: 'member-1',
        issue_date: '2026-05-01',
        expiry_date: '2027-05-01',
        doctor_license: '12345',
        is_validated: true,
        created_at: new Date().toISOString(),
      },
    ]);

    await user.click(screen.getByRole('button', { name: /Crear Certificado/i }));

    await waitFor(() => {
      expect(screen.getByText('12345')).toBeInTheDocument();
      expect(screen.getByText('2026-05-01')).toBeInTheDocument();
      expect(screen.getByText('2027-05-01')).toBeInTheDocument();
    });
  });
});
